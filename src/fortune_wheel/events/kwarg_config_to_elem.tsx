function _getChangeInput(settings: import("../../common_bc").FWSelectedItemSet) {
    return function (this: HTMLInputElement, ev: Event) {
        const parent = this.closest(".mbs-fwitemset-event");
        const hookName = parent?.getAttribute("data-name");
        const hookType = parent?.getAttribute("data-type");
        const modName = parent?.getAttribute("data-mod");
        const hook = settings.activeHooks.get(`${modName}-${hookType}-${hookName}`);
        if (!this.validity.valid) {
            if (this.type === "checkbox") {
                this.checked = this.defaultChecked;
            } else {
                this.value = this.defaultValue;
            }
            ev.stopImmediatePropagation();
            return;
        } else if (!hook) {
            ev.stopImmediatePropagation();
            return;
        }

        const kwargName = this.name;
        switch (this.type) {
            case "number":
                hook.kwargs.set(kwargName, { type: "number", value: this.valueAsNumber });
                break;
            case "text":
                hook.kwargs.set(kwargName, { type: "text", value: this.value });
                break;
            case "checkbox":
                hook.kwargs.set(kwargName, { type: "checkbox", value: this.checked });
                break;
        }
    };
}

function _getChangeSelect(settings: import("../../common_bc").FWSelectedItemSet) {
    return function (this: HTMLSelectElement, ev: Event) {
        const target = ev.target;
        const parent = this.closest(".mbs-fwitemset-event");
        const hookName = parent?.getAttribute("data-name");
        const hookType = parent?.getAttribute("data-type");
        const modName = parent?.getAttribute("data-mod");
        if (!(target instanceof HTMLOptionElement)) {
            ev.stopImmediatePropagation();
            return;
        } else if (!this.validity.valid) {
            this.querySelectorAll("option").forEach(e => e.selected = e.defaultSelected = e.hasAttribute("data-default"));
            ev.stopImmediatePropagation();
            return;
        }

        let state: "all" | "some" | "none";
        let value: Set<string>;
        const options = Array.from(this.querySelectorAll("option:not([value=''])")) as HTMLOptionElement[];
        switch (target.getAttribute("data-value")) {
            case "__mbs_all":
                state = "all";
                value = new Set(options.map(e => e.value));
                options.reverse().forEach(e => e.selected = e.defaultSelected = true);
                break;
            case "__mbs_none":
                state = "none";
                value = new Set;
                options.reverse().forEach(e => e.selected = e.defaultSelected = false);
                break;
            default:
                value = new Set;
                for (const option of options) {
                    if (option.selected) {
                        value.add(option.value);
                    }
                }

                if (value.size === options.length) {
                    state = "all";
                } else if (value.size === 0) {
                    state = "none";
                } else {
                    state = "some";
                }
                break;
        }

        const hook = settings.activeHooks.get(`${modName}-${hookType}-${hookName}`);
        if (!hook) {
            ev.stopImmediatePropagation();
            return;
        }

        const kwargName = this.name;
        if (this.multiple) {
            hook.kwargs.set(kwargName, { type: "select", value: Array.from(value)[0] });
        } else {
            hook.kwargs.set(kwargName, { type: "select-multiple", state, value });
        }
    };
}

function _parseText(
    idPrefix: string,
    name: string,
    options: WheelEvents.KwargsConfig.Text,
    settings: import("../../common_bc").FWSelectedItemSet,
): HTMLInputElement {
    const children: (string | Element)[] = [options.default];
    let list: undefined | string = undefined;
    if (options.suggestions) {
        children.push(<datalist id={`${idPrefix}-${name}-datalist`}>{options.suggestions.map(i => <option>{i}</option>)}</datalist>);
        list = `${idPrefix}-${name}-datalist`;
    }

    return ElementCreate({
        tag: "input",
        attributes: {
            type: "text",
            minlength: options.minlength,
            maxlength: options.maxlength,
            pattern: options.pattern instanceof RegExp ? options.pattern.source : options.pattern,
            spellcheck: options.spellcheck,
            list,
            size: 0,
            name,
        },
        children,
        eventListeners: {
            change: _getChangeInput(settings),
        },
    });
}

function _parseNumber(
    idPrefix: string,
    name: string,
    options: WheelEvents.KwargsConfig.Number,
    settings: import("../../common_bc").FWSelectedItemSet,
): HTMLInputElement {
    const children: (string | Element)[] = [options.default.toString()];
    let list: undefined | string = undefined;
    if (options.suggestions) {
        children.push(<datalist id={`${idPrefix}-${name}-datalist`}>{options.suggestions.map(i => <option>{i}</option>)}</datalist>);
        list = `${idPrefix}-${name}-datalist`;
    }

    const inputmode = (
        Number.isInteger(options.default)
        && Number.isInteger(options.min)
        && Number.isInteger(options.max)
        && (options.step == null || Number.isInteger(options.step))
    ) ? "numeric" : "decimal";

    return ElementCreate({
        tag: "input",
        attributes: {
            type: "number",
            min: options.min.toString(),
            max: options.max.toString(),
            step: options.step == null ? undefined : options.step.toString(),
            inputmode: options.inputmode ?? inputmode,
            list,
            size: 0,
            name,
        },
        children,
        eventListeners: {
            change: _getChangeInput(settings),
        },
    });
}

function _parseCheckbox(
    idPrefix: string,
    name: string,
    options: WheelEvents.KwargsConfig.Checkbox,
    settings: import("../../common_bc").FWSelectedItemSet,
): HTMLInputElement {
    return ElementCreate({
        tag: "input",
        attributes: {
            type: "checkbox",
            checked: options.default ? true : undefined,
            name,
        },
        eventListeners: {
            change: _getChangeInput(settings),
        },
    });
}

function _parseSelect(
    idPrefix: string,
    name: string,
    options: WheelEvents.KwargsConfig.Select | WheelEvents.KwargsConfig.SelectMultiple,
    settings: import("../../common_bc").FWSelectedItemSet,
): HTMLSelectElement {
    const children: (string | Element | undefined)[] = [];
    const optGroups: Record<string, HTMLOptionElement[]> = {};
    let defaultCount = 0;
    for (const o of options.options) {
        const optionList = o.group ? (optGroups[o.group] ??= []) : children;
        optionList.push(ElementCreate({
            tag: "option",
            attributes: {
                selected: o.default ? true : undefined,
                value: o.value,
            },
            dataAttributes: {
                default: o.default ? "" : undefined,
            },
            children: [o.label],
        }));
        if (o.default) {
            defaultCount++;
        }
    }

    for (const [group, list] of Object.entries(optGroups)) {
        children.push(<optgroup label={group}>{list}</optgroup>);
    }

    switch (options.type) {
        case "select":
            if (defaultCount > 1) {
                throw new Error(`Keyword argument "${name}" of type "${options.type}" has more than one default value (${defaultCount})`);
            }
            children.unshift(
                <option value="" selected aria-hidden="true">--Select an option--</option>,
                <hr />,
            );
            break;
        case "select-multiple":
            children.unshift(
                <option
                    value=""
                    data-value="__mbs_all"
                    selected={defaultCount === options.options.length}
                    data-default={defaultCount === options.options.length}
                >--Select all--</option>,
                <option
                    value=""
                    data-value="__mbs_none"
                    selected={defaultCount === 0}
                    data-default={defaultCount === 0}
                >--Select none--</option>,
                <hr />,
            );
            break;
        default:
            throw new Error;
    }

    return ElementCreate({
        tag: "select",
        attributes: {
            multiple: options.type === "select-multiple" ? true : undefined,
            required: options.required ? true : undefined,
            size: options.type === "select-multiple" ? (options.size ?? 5) : options.size,
            name,
        },
        eventListeners: { change: _getChangeSelect(settings) },
        children,
    });
}

/**
 * Convert the passed keyword argument configurations into a list of menuitem elements.
 * @param idPrefix An {@link HTMLElement.id} prefix for the to-be created elements
 * @param kwargs An object mapping kwarg names to their respective configs
 * @param settings An object representing a currently selected wheel of fortune item set. Used by to-be created event listeners for writing the `<input>`/`<select>` data
 * @returns A `<label>` list with kwarg-specific `<input>` and/or `<select>` elements.
 */
export function createKwargElements(
    idPrefix: string,
    kwargsConfigs: Readonly<Record<string, WheelEvents.KwargsConfig.All>>,
    settings: import("../../common_bc").FWSelectedItemSet,
): HTMLElement[] {
    const ret: HTMLElement[] = [];
    for (const [kwargName, options] of Object.entries(kwargsConfigs)) {
        let elem: HTMLElement;
        switch (options.type) {
            case "text":
                elem = _parseText(idPrefix, kwargName, options, settings);
                break;
            case "number":
                elem = _parseNumber(idPrefix, kwargName, options, settings);
                break;
            case "checkbox":
                elem = _parseCheckbox(idPrefix, kwargName, options, settings);
                break;
            case "select-multiple":
            case "select":
                elem = _parseSelect(idPrefix, kwargName, options, settings);
                break;
            default:
                throw new Error(`Unknown options type: ${(options as any).type}`);
        }

        ret.push(
            <label id={`${idPrefix}-${kwargName}`} class="mbs-fwitemset-event-kwargs" role="listitem">
                <span>{options.label}</span>
                {elem}
            </label> as HTMLLabelElement,
        );
    }
    return ret;
}
