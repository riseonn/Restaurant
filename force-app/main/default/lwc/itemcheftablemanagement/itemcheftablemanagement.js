import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

import getItemChefs from '@salesforce/apex/ItemChefTable.getItemChefs';
import updateItemChef from '@salesforce/apex/ItemChefTable.updateItemChef';
import createItemChef from '@salesforce/apex/ItemChefTable.createItemChef';
import deleteItemChef from '@salesforce/apex/ItemChefTable.deleteItemChef';

export default class ItemChefTable extends LightningElement {
    @track itemChefs = []; // Array to hold the fetched item chefs
    @track currentItemChef = {}; // Object to hold the currently selected or edited item chef
    @track isModalOpen = false; // Boolean flag to control the modal visibility
    wiredItemChefsResult; // Holds the result from the wire service

    // Status options for the Active combobox dropdown
    activeOptions = [
        { label: 'Active', value: true },
        { label: 'Inactive', value: false }
    ];

    // Columns configuration for the table
    columns = [
        { label: 'Item Chef ID', fieldName: 'ITCT__c' },
        { label: 'Name', fieldName: 'Name' },
        { label: 'Chef ID', fieldName: 'Chef_Id__c' },
        { label: 'Item ID', fieldName: 'Item_Id__c' },
        { label: 'Active', fieldName: 'Active__c' },
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

    // Fetch item chefs using wire service
    @wire(getItemChefs)
    wireItemChefs(result) {
        this.wiredItemChefsResult = result;
        if (result.data) {
            this.itemChefs = result.data; // Update item chefs with the fetched data
        } else if (result.error) {
            this.showToast('Error', 'Failed to load item chefs', 'error'); // Show error toast if fetch fails
        }
    }

    // Handle row actions (edit/delete) for each row in the table
    handleRowAction(event) {
        const action = event.detail.action.name;
        const row = event.detail.row;

        switch (action) {
            case 'edit':
                this.openEditModal(row); // Open modal for editing
                break;
            case 'delete':
                this.deleteItemChefRecord(row); // Delete the selected item chef
                break;
        }
    }

    // Open modal for editing an item chef record
    openEditModal(itemChef) {
        this.currentItemChef = { ...itemChef }; // Clone the selected item chef into currentItemChef
        this.isModalOpen = true; // Open the modal
    }

    // Handle input changes in the modal
    handleInputChange(event) {
        const { name, value } = event.target;
        this.currentItemChef[name] = value; // Update currentItemChef with new input value
    }

    // Save item chef changes (either edit or create a new one)
    saveItemChef() {
        const fields = {
            Id: this.currentItemChef.Id, // Id of the item chef (if editing)
            Name: this.currentItemChef.Name,
            Chef_Id__c: this.currentItemChef.Chef_Id__c,
            Item_Id__c: this.currentItemChef.Item_Id__c,
            Active__c: this.currentItemChef.Active__c // Include active status field
        };

        // Now we directly save the record without validating Active__c

        if (this.currentItemChef.Id) {
            // Update existing item chef
            updateItemChef({ itemChefList: [fields] })
                .then(() => {
                    this.showToast('Success', 'Item Chef updated successfully', 'success');
                    this.closeModal();
                    this.refreshItemChefs();
                })
                .catch(error => {
                    this.showToast('Error', 'Failed to update item chef', 'error');
                    console.error('Update Error:', error);
                });
        } else {
            // Insert new item chef
            createItemChef({ itemChef: fields })
                .then(() => {
                    this.showToast('Success', 'Item Chef added successfully', 'success');
                    this.closeModal();
                    this.refreshItemChefs();
                })
                .catch(error => {
                    this.showToast('Error', 'Failed to add item chef', 'error');
                    console.error('Insert Error:', error);
                });
        }
    }

    // Handle Add New button click
    handleAddNew() {
        this.currentItemChef = {}; // Clear the current item chef for a new record
        this.isModalOpen = true; // Open the modal for a new entry
    }

    // Delete item chef record
    deleteItemChefRecord(itemChef) {
        deleteItemChef({ itemChefId: itemChef.Id })
            .then(() => {
                this.showToast('Success', 'Item Chef deleted successfully', 'success');
                this.refreshItemChefs();
            })
            .catch(error => {
                this.showToast('Error', 'Failed to delete item chef', 'error');
                console.error('Delete Error:', error);
            });
    }

    // Close modal and reset the current item chef
    closeModal() {
        this.isModalOpen = false;
        this.currentItemChef = {}; // Reset current item chef
    }

    // Refresh item chefs list after any action
    refreshItemChefs() {
        return refreshApex(this.wiredItemChefsResult);
    }

    // Show toast notifications (success, error, info)
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
