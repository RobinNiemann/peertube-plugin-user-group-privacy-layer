# RN-Server

Dieses Repository enthält ein Peertube Plugin, welches die Zugriffssteuerung auf Videos anhand von User Groups ermöglicht.

# Projektstruktur
- Die Projektstruktur richtet sich nach den Vorgaben von PeerTube und deren Beispiel-Plugin.
    - Wesentlich sind die Ordner client und server, die die Logik dieses Plugins enthalten
- Falls vorhanden: Im Ordner Beispiel findest du
    - 1 anderes Plugin, an dem man sich Dinge abgucken kann
    - Den Code von PeerTube selbst, um die Implementierung nötigenfalls zu untersuchen

# Nützliche Dokumentation
Diese Links enthalten wichtige Infos darüber, wie PeerTube Plugins funktionieren:
- [Plugins&Themes Doku](https://docs.joinpeertube.org/contribute/plugins)
- [Plugins&Themes API Doku](https://docs.joinpeertube.org/api/plugins)

# Umgebung
- Du läufst ziemlich sicher in einem devcontainer
- PeerTube ist auf einem selbst betriebenen Server mit Kubernetes deployt. Optional haben wir auch die Möglichkeit eine lokale Instanz mit docker compose zum Testen hochzufahren, die ist aber nicht immer da.
