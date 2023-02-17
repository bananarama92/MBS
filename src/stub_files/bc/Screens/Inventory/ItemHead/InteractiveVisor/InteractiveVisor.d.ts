declare function InventoryItemHeadInteractiveVisorLoad(): void;
declare function InventoryItemHeadInteractiveVisorDraw(): void;
declare function InventoryItemHeadInteractiveVisorClick(): void;
declare function InventoryItemHeadInteractiveVisorPublishAction(C: any, Option: any): void;
declare function InventoryItemHeadInteractiveVisorExit(): void;
declare function InventoryItemHeadInteractiveVisorValidate(C: any, Item: any): string;
declare function InventoryItemHeadInteractiveVisorNpcDialog(C: any, Option: any): void;
declare var InventoryItemHeadInteractiveVisorOptions: ({
    Name: string;
    Property: {
        Type: any;
        SelfUnlock: boolean;
        Effect: any[];
    };
} | {
    Name: string;
    Property: {
        Type: string;
        Effect: string[];
        SelfUnlock?: undefined;
    };
})[];
