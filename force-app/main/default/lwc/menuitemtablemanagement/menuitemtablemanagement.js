import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

// IMPORTANT: Ensure the import paths match exactly
import getMenuItems from '@salesforce/apex/MenuItemTable.getMenuItems';
import updateMenuItem from '@salesforce/apex/MenuItemTable.updateMenuItem';
import deleteMenuItem from '@salesforce/apex/MenuItemTable.deleteMenuItem';
import { createRecord } from 'lightning/uiRecordApi';
import MENU_ITEM_OBJECT from '@salesforce/schema/Menu_Item_Table__c';  // Ensure correct schema for the menu item object

export default class MenuItemTable extends NavigationMixin(LightningElement) {
    @track menuItems = [];
    @track currentMenuItem = {};
    @track isModalOpen = false;
    @track upsertLabel = 'Edit';  // Add a label to toggle between Insert and Edit modes
    wiredMenuItemsResult;

    columns = [
        { label: 'Menu Item ID', fieldName: 'MITID__c' },
        { label: 'Item ID', fieldName: 'MITEM_ID__c' },
        { label: 'Menu ID', fieldName: 'MENUIT_ID__c' },
        { label: 'Menu Item Name', fieldName: 'Name' },
        { label: 'Active', fieldName: 'Active__c', type: 'boolean' },
        { label: 'Owner', fieldName: 'OwnerId' },
        { label: 'Created By', fieldName: 'CreatedById' },
        { label: 'Last Modified By', fieldName: 'LastModifiedById' },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: 'Edit', name: 'edit' },
                    { label: 'Delete', name: 'delete' }
                ]
            }
        }
    ];

    @wire(getMenuItems)
    wiredItems(result) {
        this.wiredMenuItemsResult = result;
        if (result.data) {
            this.menuItems = result.data;
        } else if (result.error) {
            this.handleError(result.error);
        }
    }

    handleRowAction(event) {
        const action = event.detail.action?.name;  // Safe navigation operator to handle missing `action`
        const row = event.detail.row;

        if (!action || !row) return;  // Guard clause if action or row is missing

        switch (action) {
            case 'edit':
                this.openEditModal(row);
                break;
            case 'delete':
                this.deleteMenuItemRecord(row);
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }

    openEditModal(menuItem) {
        this.currentMenuItem = { ...menuItem };
        this.upsertLabel = 'Edit';
        this.isModalOpen = true;
    }

    handleInputChange(event) {
        const { name, value, checked, type } = event.target;
        this.currentMenuItem[name] = type === 'checkbox' ? checked : value;
    }

    handleAddNew() {
        this.currentMenuItem = {}; // Clear the current menu item for new entry
        this.upsertLabel = 'Insert'; // Set the label to Insert mode
        this.isModalOpen = true; // Open the modal for new entry
    }

    saveMenuItem() {
        const fields = { ...this.currentMenuItem };

        // If no ID exists, we will create a new menu item
        if (!this.currentMenuItem.Id) {
            const recordInput = { apiName: MENU_ITEM_OBJECT.objectApiName, fields };

            createRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Menu Item created', 'success');
                    this.closeModal();
                    return refreshApex(this.wiredMenuItemsResult);
                })
                .catch(error => {
                    this.handleError(error);
                });
        } else {
            // Otherwise, update the existing menu item
            updateMenuItem({ menuItemList: [this.currentMenuItem] })
                .then(() => {
                    this.showToast('Success', 'Menu Item updated', 'success');
                    this.closeModal();
                    return refreshApex(this.wiredMenuItemsResult);
                })
                .catch(error => {
                    this.handleError(error);
                });
        }
    }

    deleteMenuItemRecord(menuItem) {
        deleteMenuItem({ menuItemId: menuItem.Id })
            .then(() => {
                this.showToast('Success', 'Menu Item deleted', 'success');
                return refreshApex(this.wiredMenuItemsResult);
            })
            .catch(error => {
                this.handleError(error);
            });
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentMenuItem = {};
    }

    handleError(error) {
        let errorMessage = 'Unknown error';
        if (error.body) {
            errorMessage = error.body.message || error.body.errorMessage || error.message;
        }
        this.showToast('Error', errorMessage, 'error');
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    // Optional: Clean up wire result when component is destroyed
    disconnectedCallback() {
        if (this.wiredMenuItemsResult) {
            this.wiredMenuItemsResult = null;  // Clear the wire result
        }
    }
}
