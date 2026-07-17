import { Component } from 'cc';

export class LogService {
    public static checkAssignments<T extends Component>(
        owner: T,
        propertyNames: Array<keyof T>,
    ): boolean {
        let valid = true;

        for (const propertyName of propertyNames) {
            if (owner[propertyName] != null) continue;

            valid = false;

            console.warn(
                `[${owner.constructor.name}] Missing assignment: ${String(propertyName)}`,
                owner,
            );
        }

        return valid;
    }
}
