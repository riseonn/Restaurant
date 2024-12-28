import { LightningElement, track, wire } from 'lwc';
import { updateRecord, createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getIngredients from '@salesforce/apex/IngredientTable.getIngredients';
import getUsers from '@salesforce/apex/IngredientTable.getUsers';
import deleteIngredient from '@salesforce/apex/IngredientTable.deleteIngredient';
import { refreshApex } from '@salesforce/apex';
import INGREDIENT_OBJECT from '@salesforce/schema/Ingredient_Table__c'; // Add schema import for createRecord

export default class IngredientTable extends LightningElement {
    @track data = [];
    @track userOptions = [];
    @track wiredIngredientsResult;
    @track isEditModalOpen = false;
    @track currentIngredient = {};
    @track upsertLabel = 'Edit'; // Used for modal title

    columns = [
        { 
            label: 'Ingredient ID', 
            fieldName: 'itid__c',
            sortable: true 
        },
        { 
            label: 'Title', 
            fieldName: 'Title__c',
            sortable: true 
        },
        { 
            label: 'User Name', 
            fieldName: 'userName',
            sortable: true 
        },
        { 
            label: 'UTID', 
            fieldName: 'userUTID',
            sortable: true 
        },
        { 
            label: 'Content', 
            fieldName: 'Content__c',
            wrapText: true 
        },
        { 
            label: 'Quantity', 
            fieldName: 'Quantity__c',
            type: 'number',
            sortable: true 
        },
        { 
            label: 'Unit', 
            fieldName: 'Unit__c' 
        },
        { 
            label: 'SKU', 
            fieldName: 'SKU__c' 
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

    @wire(getIngredients)
    wiredIngredients(result) {
        this.wiredIngredientsResult = result;
        const { data, error } = result;
        if (data) {
            this.data = data.map(record => ({
                ...record,
                userName: record.User_Id__r ? record.User_Id__r.Name : '',
                userUTID: record.User_Id__r ? record.User_Id__r.UTID__c : '',
                User_Id__c: record.User_Id__c
            }));
        } else if (error) {
            this.showToast('Error', 'Failed to fetch ingredients', 'error');
            console.error('Error:', error);
        }
    }

    @wire(getUsers)
    wiredUsers({ data, error }) {
        if (data) {
            this.userOptions = [
                { label: '-- Select User --', value: '' },
                ...data.map(user => ({
                    label: user.Name + (user.UTID__c ? ` (${user.UTID__c})` : ''),
                    value: user.Id
                }))
            ];
        } else if (error) {
            this.showToast('Error', 'Failed to fetch users', 'error');
            console.error('Error:', error);
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
        this.upsertLabel = 'Edit';
        this.currentIngredient = { ...row }; // Copy the row data for editing
        this.isEditModalOpen = true;
    }

    handleAddNew() {
        this.upsertLabel = 'Insert';
        this.currentIngredient = {}; // Clear the current ingredient for a new record

        // Pre-populate some default values if needed
        this.currentIngredient.Title__c = ''; // Example of default value, adjust based on your requirements
        this.isEditModalOpen = true; // Open the modal for new entry
    }

    handleInputChange(event) {
        const { name, value } = event.target;
        const fieldMap = {
            'title': 'Title__c',
            'username': 'User_Id__c',
            'content': 'Content__c',
            'quantity': 'Quantity__c',
            'unit': 'Unit__c',
            'sku': 'SKU__c',
            'slug': 'Slug__c'
        };

        const fieldName = fieldMap[name];
        if (fieldName) {
            this.currentIngredient = {
                ...this.currentIngredient,
                [fieldName]: value
            };

            // Update User_Id__r when username changes
            if (name === 'username') {
                const selectedUser = this.userOptions.find(option => option.value === value);
                if (selectedUser) {
                    const [userName, userUTID] = selectedUser.label.split(' (');
                    this.currentIngredient.User_Id__r = {
                        Name: userName,
                        UTID__c: userUTID ? userUTID.replace(')', '') : ''
                    };
                }
            }
        }
    }

    validateFields() {
        const requiredFields = {
            'Title__c': 'Title',
            'User_Id__c': 'User',
            'Content__c': 'Content',
            'Quantity__c': 'Quantity'
        };

        for (const [field, label] of Object.entries(requiredFields)) {
            if (!this.currentIngredient[field]) {
                this.showToast('Error', `${label} is required.`, 'error');
                return false;
            }
        }

        return true;
    }

    handleSaveIngredient() {
        if (!this.validateFields()) {
            return;
        }

        const fields = {
            Id: this.currentIngredient.Id,
            Title__c: this.currentIngredient.Title__c,
            User_Id__c: this.currentIngredient.User_Id__c,
            Content__c: this.currentIngredient.Content__c,
            Quantity__c: this.currentIngredient.Quantity__c,
            Unit__c: this.currentIngredient.Unit__c,
            SKU__c: this.currentIngredient.SKU__c,
            Slug__c: this.currentIngredient.Slug__c
        };

        if (!this.currentIngredient.Id) {
            // Insert new record using createRecord if no ID is provided
            const recordInput = { apiName: INGREDIENT_OBJECT.objectApiName, fields };

            createRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Ingredient added successfully', 'success');
                    this.isEditModalOpen = false;
                    return refreshApex(this.wiredIngredientsResult);
                })
                .catch((error) => {
                    this.showToast('Error', `Failed to add ingredient: ${error.body.message}`, 'error');
                    console.error('Error inserting record:', error);
                });
        } else {
            // Update existing record
            const recordInput = { fields };

            updateRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Ingredient updated successfully', 'success');
                    this.isEditModalOpen = false;
                    return refreshApex(this.wiredIngredientsResult);
                })
                .catch((error) => {
                    this.showToast('Error', `Failed to update ingredient: ${error.body.message}`, 'error');
                    console.error('Error updating record:', error);
                });
        }
    }

    handleModalClose() {
        this.isEditModalOpen = false;
        this.currentIngredient = {}; // Reset the current ingredient
    }

    handleDelete(row) {
        if (confirm('Are you sure you want to delete this ingredient?')) {
            deleteIngredient({ ingredientId: row.Id })
                .then(() => {
                    this.showToast('Success', 'Ingredient deleted successfully', 'success');
                    return refreshApex(this.wiredIngredientsResult);
                })
                .catch((error) => {
                    this.showToast('Error', `Failed to delete ingredient: ${error.body.message}`, 'error');
                    console.error('Error deleting record:', error);
                });
        }
    }

    showToast(title, message, variant) {
        const toast = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(toast);
    }
}
