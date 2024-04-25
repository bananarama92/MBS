import type { ModSDKModInfo } from "bondage-club-mod-sdk";
import { pick } from "lodash-es";

import { MBS_MOD_INFO } from "../common";

const register: Record<string, RegistrationData> = {};

export class RegistrationData implements ModSDKModInfo {
    /** Get a copy of all registered mods */
    static get modList(): ModSDKModInfo[] {
        return Object.values(register).map(i => {
            return pick(i, "name", "fullName", "version", "repository");
        }).sort((i, j) => {
            return i.fullName.localeCompare(j.fullName);
        });
    }

    /** Get a copy of all registered mods */
    get modList() {
        return (this.constructor as typeof RegistrationData).modList;
    }

    readonly name: string;
    readonly fullName: string;
    readonly version: string;
    readonly repository?: string;

    constructor(name: string, fullName: string, version: string, repository?: string) {
        if (typeof name !== "string") {
            throw new TypeError(`Invalid "name" type, expected a string: ${typeof name}`);
        } else if (typeof fullName !== "string") {
            throw new TypeError(`Invalid "fullName" type, expected a string: ${typeof fullName}`);
        } else if (typeof version !== "string") {
            throw new TypeError(`Invalid "version" type, expected a string: ${typeof version}`);
        } else if (repository != null && typeof repository !== "string") {
            throw new TypeError(`Invalid "repository" type, expected a string: ${typeof repository}`);
        }

        this.name = name;
        this.fullName = fullName;
        this.version = version;
        this.repository = repository ?? undefined;
        if (register[this.fullName]) {
            throw new Error(`${this.name}: ${this.fullName} ${this.version} has already been registered`);
        }
        register[this.fullName] = Object.freeze(this);
    }

    static fromModInfo(info: ModSDKModInfo): RegistrationData {
        if (info === null) {
            throw new Error();
        } else if (typeof info !== "object") {
            throw new TypeError();
        }
        return new RegistrationData(info.name, info.fullName, info.version, info.repository);
    }
}

export const MBS_REGISTRATION_DATA = RegistrationData.fromModInfo(MBS_MOD_INFO);
