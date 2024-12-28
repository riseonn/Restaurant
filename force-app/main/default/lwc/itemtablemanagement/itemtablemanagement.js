import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { createRecord, updateRecord } from 'lightning/uiRecordApi'; // Import createRecord for inserting
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import ITEM_OBJECT from '@salesforce/schema/Item_Table__c'; // Import the Item object schema
import getItems from '@salesforce/apex/ItemTable.getItems';
import updateItems from '@salesforce/apex/ItemTable.updateItem';

export default class ItemTable extends NavigationMixin(LightningElement) {
    @track data = [];
    wiredItemsResult;
    isEditModalOpen = false;
    @track currentItem = {};
    @track upsertLabel = 'Edit';  // For Insert/Edit toggle

    // Columns for the lightning datatable
    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'IMID', fieldName: 'IMID__c' },
        { label: 'Content', fieldName: 'Content__c' },
        { label: 'Cooking', fieldName: 'Cooking__c' },
        { label: 'Price', fieldName: 'Price__c' },
        { label: 'Quantity', fieldName: 'Quantity__c' },
        { label: 'SKU', fieldName: 'SKU__c' },
        { label: 'Slug', fieldName: 'Slug__c' },
        { label: 'Summary', fieldName: 'Summary__c' },
        { label: 'Title', fieldName: 'Title__c' },
        { label: 'Type', fieldName: 'Type__c' },
        { label: 'Unit', fieldName: 'Unit__c' },
        { label: 'Vendor ID', fieldName: 'Vendor_Id__c' },
        { label: 'Created By', fieldName: 'CreatedById' },
        { label: 'Last Modified By', fieldName: 'LastModifiedById' },
        { label: 'Owner ID', fieldName: 'OwnerId' },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    {
                        label: 'Edit',
                        name: 'edit',
                        type: 'button-icon',
                        typeAttributes: {
                            name: 'Edit',
                            title: 'Edit',
                            iconName: 'utility:edit'
                        }
                    },
                    {
                        label: 'Delete',
                        name: 'delete',
                        type: 'button-icon',
                        typeAttributes: {
                            name: 'Delete',
                            title: 'Delete',
                            iconName: 'utility:delete',
                            iconClass: 'slds-icon-text-error'
                        }
                    }
                ]
            }
        }
    ];

    // Wire getItems Apex method
    @wire(getItems)
    wiredItems(result) {
        this.wiredItemsResult = result;
        const { data, error } = result;
        if (data) {
            this.data = data;
        } else if (error) {
            this.showToast('Error', 'Failed to fetch items', 'error');
        }
    }

    // Handle row actions (Edit and Delete)
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch (actionName) {
            case 'edit':
                this.handleEdit(row);
                break;
            case 'delete':
                this.handleDelete(row);
                break;
        }
    }

    // Handle editing an item
    handleEdit(row) {
        this.currentItem = { ...row };
        this.upsertLabel = 'Edit'; // Set label for Edit
        this.isEditModalOpen = true;
    }

    // Handle adding a new item (Insert)
    handleAddNew() {
        this.currentItem = {};  // Reset the item object for new entry
        this.upsertLabel = 'Insert'; // Set label for Insert
        this.isEditModalOpen = true;  // Open the modal for new entry
    }

    // Unified change handler for modal inputs
    handleInputChange(event) {
        const { name, value } = event.target;

        const fieldMap = {
            'name': 'Name',
            'imId': 'IMID__c',
            'content': 'Content__c',
            'cooking': 'Cooking__c',
            'price': 'Price__c',
            'quantity': 'Quantity__c',
            'sku': 'SKU__c',
            'slug': 'Slug__c',
            'summary': 'Summary__c',
            'title': 'Title__c',
            'type': 'Type__c',
            'unit': 'Unit__c',
            'vendorId': 'Vendor_Id__c'
        };

        const fieldName = fieldMap[name];
        if (fieldName) {
            this.currentItem = {
                ...this.currentItem,
                [fieldName]: value
            };
        }
    }

    // Handle saving the item (Insert or Update)
    handleSaveItem() {
        const fields = { ...this.currentItem };

        // If no ID is provided, create a new record
        if (!this.currentItem.Id) {
            const recordInput = { apiName: ITEM_OBJECT.objectApiName, fields };

            createRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Item added successfully', 'success');
                    this.isEditModalOpen = false;
                    this.refreshData();
                })
                .catch((error) => {
                    this.showToast('Error', `Failed to add item: ${error.body.message}`, 'error');
                });
        } else {
            // Otherwise, update the existing record
            const recordInput = { fields };

            updateRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Item updated successfully', 'success');
                    this.isEditModalOpen = false;
                    this.refreshData();
                })
                .catch((error) => {
                    this.showToast('Error', `Failed to update item: ${error.body.message}`, 'error');
                });
        }
    }

    // Handle modal close
    handleModalClose() {
        this.isEditModalOpen = false;
    }

    // Handle deleting an item
    handleDelete(row) {
        deleteItemChef({ itemChefId: row.Id })
            .then(() => {
                this.showToast('Success', 'Item deleted successfully', 'success');
                this.refreshData();
            })
            .catch((error) => {
                this.showToast('Error', `Failed to delete item: ${error.body.message}`, 'error');
            });
    }

    // Refresh the data in the table
    refreshData() {
        return refreshApex(this.wiredItemsResult);
    }

    // Show toast messages
    showToast(title, message, variant) {
        const toast = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toast);
    }
}
