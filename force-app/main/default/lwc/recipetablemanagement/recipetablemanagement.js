import { LightningElement, track, wire } from 'lwc';
import { updateRecord, createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getRecipes from '@salesforce/apex/RecipeTable.getRecipes';
import deleteRecipe from '@salesforce/apex/RecipeTable.deleteRecipe';
import RECIPE_OBJECT from '@salesforce/schema/Recipe_Table__c';

export default class RecipeTable extends LightningElement {
    @track data = [];
    wiredRecipesResult;
    isEditModalOpen = false;
    @track currentRecipe = {};

    columns = [
        { label: 'Recipe ID', fieldName: 'RPID__c' },
        { label: 'Name', fieldName: 'Name' },
        { label: 'Instructions', fieldName: 'Instructions__c' },
        { label: 'Quantity', fieldName: 'Quantity__c', type: 'number' },
        { label: 'Unit', fieldName: 'Unit__c' },
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

    @wire(getRecipes)
    wiredRecipes(result) {
        this.wiredRecipesResult = result;
        const { data, error } = result;
        if (data) {
            this.data = [...data];
        } else if (error) {
            this.showToast('Error', error.body?.message || 'Failed to fetch recipes', 'error');
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
            default:
                break;
        }
    }

    handleEdit(row) {
        this.currentRecipe = { ...row };
        this.isEditModalOpen = true;
    }

    handleDelete(row) {
        if (!row.Id) {
            this.showToast('Error', 'Invalid recipe ID', 'error');
            return;
        }

        deleteRecipe({ recipeId: row.Id })
            .then(() => {
                this.showToast('Success', 'Recipe deleted successfully', 'success');
                return this.refreshData();
            })
            .catch((error) => {
                this.showToast('Error', error.body?.message || 'Failed to delete recipe', 'error');
            });
    }

    handleSaveRecipe() {
        if (!this.validateFields()) {
            return;
        }

        if (this.currentRecipe.Id) {
            this.handleUpdate();
        } else {
            this.handleCreate();
        }
    }

    validateFields() {
        const inputFields = this.template.querySelectorAll('lightning-input, lightning-textarea');
        let isValid = true;

        inputFields.forEach(field => {
            if (field.required && !field.value) {
                field.reportValidity();
                isValid = false;
            }
        });

        return isValid;
    }

    handleUpdate() {
        const recordInput = {
            fields: {
                Id: this.currentRecipe.Id,
                Name: this.currentRecipe.Name,
                Instructions__c: this.currentRecipe.Instructions__c,
                Quantity__c: this.currentRecipe.Quantity__c ? parseFloat(this.currentRecipe.Quantity__c) : null,
                Unit__c: this.currentRecipe.Unit__c,
                RPIND__c: this.currentRecipe.RPIND__c,
                RPITD__c: this.currentRecipe.RPITD__c
            }
        };

        updateRecord(recordInput)
            .then(() => {
                this.showToast('Success', 'Recipe updated successfully', 'success');
                this.handleModalClose();
                return this.refreshData();
            })
            .catch((error) => {
                console.error('Update error:', error);
                this.showToast('Error', error.body?.message || 'Failed to update recipe', 'error');
            });
    }

    handleCreate() {
        const fields = {
            Name: this.currentRecipe.Name,
            Instructions__c: this.currentRecipe.Instructions__c,
            Quantity__c: this.currentRecipe.Quantity__c ? parseFloat(this.currentRecipe.Quantity__c) : null,
            Unit__c: this.currentRecipe.Unit__c,
            RPIND__c: this.currentRecipe.RPIND__c,
            RPITD__c: this.currentRecipe.RPITD__c
        };

        const recordInput = { apiName: RECIPE_OBJECT.objectApiName, fields };

        createRecord(recordInput)
            .then(() => {
                this.showToast('Success', 'Recipe created successfully', 'success');
                this.handleModalClose();
                return this.refreshData();
            })
            .catch((error) => {
                console.error('Create error:', error);
                this.showToast('Error', error.body?.message || 'Failed to create recipe', 'error');
            });
    }

    refreshData() {
        return refreshApex(this.wiredRecipesResult);
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }

    handleInputChange(event) {
        const { name, value } = event.target;
        this.currentRecipe = { ...this.currentRecipe, [name]: value };
    }

    handleModalClose() {
        this.isEditModalOpen = false;
        this.currentRecipe = {};
    }

    get modalTitle() {
        return this.currentRecipe.Id ? 'Edit Recipe' : 'New Recipe';
    }
}