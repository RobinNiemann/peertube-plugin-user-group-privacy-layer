# Bugfix: Zu wenige Videos in Übersichtslisten (Paginierung vs. Filterung)

## Problem / Context

Auf Prod zeigt das Plugin **wesentlich weniger Videos** in Übersichtslisten an, als dem User
freigegeben sind. Lokal nicht reproduzierbar.

**Ursache (im Code bestätigt):** Alle Listen-Hooks waren `filter:api.*.list.result`-Hooks. Sie
laufen **nach** der DB-Abfrage und **nach der Paginierung**. PeerTube lädt z.B. nur Seite 1
(`count=25`, `start=0`), das Plugin filtert diese 25 Videos auf die erlaubten herunter und
überschrieb zusätzlich `result.total = result.data.length`.

Der eigentliche Bruch liegt im Frontend (`videos-list.component.ts`):

```ts
// No more results
if (this.lastQueryLength !== undefined && this.lastQueryLength < this.pagination.itemsPerPage) return
```

Das Infinite-Scroll lädt **keine weitere Seite**, sobald eine Seite weniger Items liefert als
angefragt. Sobald das Plugin also auch nur **ein** Video aus einer Seite filtert
(25 angefragt → 24 geliefert), interpretiert das Frontend das als „Ende der Liste" und stoppt.
Erlaubte Videos auf späteren DB-Seiten werden nie geladen.

**Warum lokal nicht sichtbar:** Lokal passten alle Videos auf eine Seite (≤ ~25) bzw. der Testuser
sah Seite 1 ungefiltert → kein Truncation-Effekt. Auf Prod gibt es > 1 Seite → Bug tritt auf.

**Kernerkenntnis:** Post-Pagination-Filterung in `...list.result` ist mit PeerTubes Infinite-Scroll
grundsätzlich nicht korrigierbar — eine gekürzte Seite sieht immer wie die letzte aus. Die
Filterung muss **vor** dem Zuschneiden der Seite passieren. `VideoModel.listForApi` bietet keine
Option, per Video-ID-Menge zu filtern → reine Query-Level-Filterung über den `params`-Hook ist nicht
möglich. Lösung: über den `params`-Hook **mehr laden** und im `result`-Hook nach dem Filtern
**selbst paginieren**.

## Diagnose auf Prod (Hypothese bestätigen)

Zugang: kubectl (logs + exec) und Browser-UI.

### A. Reproduktion + Netzwerk-Inspektion im Browser
1. Als betroffener User einloggen, Übersicht/"Videos"-Seite öffnen, bis ans Ende scrollen.
2. DevTools → Network → Request `GET /api/v1/videos?...count=25...` öffnen, Response-JSON prüfen.
   - **Erwartung (vor Fix):** `data.length < 25` und `total == data.length`. Infinite-Scroll hat
     nach dieser kurzen Seite gestoppt.
3. Beweis, dass weiter hinten erlaubte Videos liegen: Request als **cURL** kopieren (enthält den
   Bearer-Token) und mit `start=25`, `start=50`, … erneut absenden. Es kommen weitere Videos zurück,
   die in der UI nie erschienen sind → bestätigt reines Pagination-Truncation.

### B. Logs prüfen (Sekundärursachen ausschließen)
```
kubectl logs <peertube-pod> --since=1h | grep -iE "user-group|privacy|TypeError|Cannot read"
```
Prüft, ob ein Hook crasht (z.B. `params.user.id` bei anonymen Requests).

### C. Ground-Truth per psql (kubectl exec in den Postgres-Pod)
Soll-Anzahl erlaubter Videos für den User (`<UID>` einsetzen) — erlaubt = über Gruppe freigegeben
**oder** selbst Owner:
```sql
-- über Gruppen freigegeben
SELECT COUNT(DISTINCT ugv.video_id)
FROM user_group_2_video ugv
JOIN user_group_2_user ugu ON ugu.user_group_id = ugv.user_group_id
WHERE ugu.user_id = <UID>;

-- eigene Videos
SELECT COUNT(*) FROM video v
JOIN "videoChannel" vc ON v."channelId" = vc.id
JOIN account a ON vc."accountId" = a.id
WHERE a."userId" = <UID>;
```
Summe mit der in der UI sichtbaren Anzahl vergleichen → Lücke quantifiziert den Bug.

## Lösung: Over-Fetch → einmal filtern → selbst paginieren

Im `params`-Hook das angefragte `start`/`count` merken und die Query auf `start=0`, großes `count`
aufweiten. Im `result`-Hook **einmal** alle geladenen Videos gegen die Erlaubt-Menge filtern, dann
auf das ursprüngliche Fenster `[start, start+count]` zuschneiden und `total` korrekt setzen. So
liefert jede Seite wieder volle `count` erlaubte Videos → Infinite-Scroll läuft weiter, klassische
Paginierung stimmt.

### Geänderte Dateien
- `server/main.ts` — zu jedem `...list.result`-Hook den passenden `...list.params`-Hook
  registrieren.
- `server/service/hook-handler-factory.ts` — generische `buildListParamsHandler` /
  `buildListResultHandler` (Over-Fetch + Filtern + Slice); `userId` robust (`?? -1`).
- `server/service/group-permission-service.ts` + `db-service.ts` — Batch-Methode
  `getAllowedVideoIds(userId, candidateVideoIds)` (wenige parametrisierte Queries statt 2 pro Video).

### Trade-off
Pro Seitenabruf werden bis `MAX_FETCH` Videos geladen und gefiltert (für Self-Hosted-Instanz mit
moderater Videoanzahl unkritisch). Wird `MAX_FETCH` erreicht → `logger.warn` (kein stilles
Abschneiden). Optional später: kurzlebiger Cache der Erlaubt-ID-Menge pro User.

## Verifikation
1. **Lokal:** > 25 Videos anlegen, einen Teil per Gruppe für Testuser freigeben, einen Teil nicht.
   Übersicht durchscrollen → **alle** freigegebenen Videos erscheinen (über mehrere Seiten),
   gesperrte nie.
2. **API direkt:** `GET /api/v1/videos?start=0&count=25` und `...&start=25&count=25` als Testuser →
   volle Seiten erlaubter Videos, `total` = Gesamtzahl erlaubter Videos (nicht Seitenlänge).
3. **Regression:** Owner sieht eigene Videos; anonymer Request liefert keinen Crash (kein 500).
