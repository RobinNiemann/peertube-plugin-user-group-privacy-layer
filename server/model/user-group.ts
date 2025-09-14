export class UserGroup {
    name: string;
    members: string[];

    constructor(name: string) {
        this.name = name;
        this.members = [];
    }

}