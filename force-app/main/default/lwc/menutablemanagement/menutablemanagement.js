import { LightningElement, track, wire } from 'lwc';
import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import getMenuItems from '@salesforce/apex/MenuTable.getMenuItems';
import deleteMenuItem from '@salesforce/apex/MenuTable.deleteMenuItem';
import updateMenuItem from '@salesforce/apex/MenuTable.updateMenuItem';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import MENU_TABLE_OBJECT from '@salesforce/schema/Menu_Table__c';

export default class MenuTable extends LightningElement {
    @track data = [];
    wiredMenuItemsResult;
    isEditModalOpen = false;
    @track currentMenuItem = {};
    upsertLabel = 'Edit';
    
    typeOptions = [
        { label: 'Appetizer', value: 'Appetizer' },
        { label: 'Main Course', value: 'Main Course' },
        { label: 'Dessert', value: 'Dessert' },
        { label: 'Beverage', value: 'Beverage' },
        { label: 'Specialty', value: 'Specialty' }
    ];

    columns = [
        { label: 'MTID', fieldName: 'MTID__c' },
        { label: 'Name', fieldName: 'Name' },
        { label: 'Title', fieldName: 'Title__c' },
        { label: 'Slug', fieldName: 'Slug__c' },
        { label: 'Type', fieldName: 'Type__c' },
        { label: 'Summary', fieldName: 'Summary__c', type: 'text', wrapText: true },
        { label: 'Content', fieldName: 'Content__c', type: 'text', wrapText: true },
        { 
            label: 'Created At', 
            fieldName: 'CreatedDate', 
            type: 'date',
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }
        },
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
    wiredMenuItems(result) {
        this.wiredMenuItemsResult = result;
        const { data, error } = result;
        if (data) {
            this.data = data;
        } else if (error) {
            this.showToast('Error', error.body.message, 'error');
        }
    }

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

    handleEdit(row) {
        this.currentMenuItem = { ...row };
        this.upsertLabel = 'Edit';
        this.isEditModalOpen = true;
    }

    handleAddNew() {
        this.currentMenuItem = {};
        this.upsertLabel = 'Add New';
        this.isEditModalOpen = true;
    }

    handleInputChange(event) {
        const { name, value } = event.target;
        this.currentMenuItem = {
            ...this.currentMenuItem,
            [name]: value
        };
    }

    validateFields() {
        const allValid = [...this.template.querySelectorAll('lightning-input, lightning-combobox')]
            .filter(input => input.required)
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);

        return allValid;
    }

    handleSaveMenuItem() {
        if (!this.validateFields()) {
            return;
        }

        const fields = { ...this.currentMenuItem };
        
        if (!fields.Id) {
            const recordInput = { apiName: MENU_TABLE_OBJECT.objectApiName, fields };
            createRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Menu item created successfully', 'success');
                    this.handleModalClose();
                    return this.refreshData();
                })
                .catch(error => {
                    this.showToast('Error', error.body.message, 'error');
                });
        } else {
            updateMenuItem({ menuItem: fields })
                .then(() => {
                    this.showToast('Success', 'Menu item updated successfully', 'success');
                    this.handleModalClose();
                    return this.refreshData();
                })
                .catch(error => {
                    this.showToast('Error', error.body.message, 'error');
                });
        }
    }

    handleModalClose() {
        this.isEditModalOpen = false;
        this.currentMenuItem = {};
    }

    handleDelete(row) {
        if (confirm('Are you sure you want to delete this menu item?')) {
            deleteMenuItem({ menuItemId: row.Id })
                .then(() => {
                    this.showToast('Success', 'Menu item deleted successfully', 'success');
                    return this.refreshData();
                })
                .catch(error => {
                    this.showToast('Error', error.body.message, 'error');
                });
        }
    }

    refreshData() {
        return refreshApex(this.wiredMenuItemsResult);
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
}