function _resetKwargElement(elem: Element) {
    if (elem instanceof HTMLInputElement) {
        switch (elem.type) {
            case "checkbox":
                elem.checked = elem.defaultChecked;
                break;
            case "number":
            case "text":
                elem.value = elem.defaultValue;
                break;
        }
    } else if (elem instanceof HTMLSelectElement) {
        for (const option of elem.options) {
            option.selected = option.defaultSelected = option.hasAttribute("data-default");
        }
    }
}

/**
 * Reset all kwarg-related `<input>`/`<select>` elements to their default state.
 * @param root The root element containing all kwarg-specific `<input>`/`<select>` elements
 */
export function resetKwargElements(root: Element) {
    root.querySelectorAll(".mbs-fwitemset-event-menu input, .mbs-fwitemset-event-menu select").forEach(e => _resetKwargElement(e));
}

/**
 * Update all kwarg-related elements in `root` based on the passed (user-configured) keyword arguments.
 * @param root The root element containing all kwarg-specific `<input>`/`<select>` elements
 * @param kwargs The (user-configured) keyword arguments
 */
export function updateKwargElements(root: Element, kwargs: Map<string, WheelEvents.Kwargs.All>) {
    const inputs = root.querySelectorAll(".mbs-fwitemset-event-menu input, .mbs-fwitemset-event-menu select");
    for (const elem of inputs) {
        const name = elem.getAttribute("name");
        if (!name) {
            continue;
        }

        const kwarg = kwargs.get(name);
        switch (kwarg?.type) {
            case "checkbox":
                if (elem instanceof HTMLInputElement && elem.type === "checkbox") {
                    elem.checked = kwarg.value;
                }
                break;
            case "text":
                if (elem instanceof HTMLInputElement && elem.type === "text") {
                    elem.value = kwarg.value;
                }
                break;
            case "number":
                if (elem instanceof HTMLInputElement && elem.type === "number") {
                    elem.valueAsNumber = kwarg.value;
                }
                break;
            case "select-multiple":
            case "select":
                if (elem instanceof HTMLSelectElement) {
                    const values = kwarg.value instanceof Set ? kwarg.value : new Set([kwarg.value]);
                    for (const option of elem.options) {
                        const dataValue = elem.getAttribute("data-value");
                        if (kwarg.state === "all") {
                            option.selected = option.defaultSelected = dataValue !== "__mbs_none";
                        } else if (kwarg.state === "none") {
                            option.selected = option.defaultSelected = dataValue === "__mbs_none";
                        } else {
                            option.selected = option.defaultSelected = values.has(option.value);
                        }
                    }
                }
                break;
            default:
                _resetKwargElement(elem);
                break;
        }
    }
}
