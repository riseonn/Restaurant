import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord, createRecord } from 'lightning/uiRecordApi';
import getTransactions from '@salesforce/apex/TransactionTable.getTransactions';
import deleteTransaction from '@salesforce/apex/TransactionTable.deleteTransaction';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import TRANS_OBJECT from '@salesforce/schema/Transaction_Table__c';

export default class TransactionTable extends NavigationMixin(LightningElement) {
    @track data = [];
    @track error;
    @track isEditModalOpen = false;
    @track currentTransaction = {};
    wiredTransactionsResult;
    @track upsertLabel = 'Edit';

    columns = [
        { label: 'Transaction ID', fieldName: 'TNID__c' },
        { label: 'Code', fieldName: 'Code__c' },
        { label: 'Content', fieldName: 'Content__c' },
        { label: 'Created By', fieldName: 'CreatedById' },
        { label: 'Last Modified By', fieldName: 'LastModifiedById' },
        { label: 'Mode', fieldName: 'Mode__c' },
        { label: 'Order ID', fieldName: 'Order_Id__c' },
        { label: 'Status', fieldName: 'Status__c' },
        { label: 'Name', fieldName: 'Name' },
        { label: 'Type', fieldName: 'Type__c' },
        { label: 'User ID', fieldName: 'User_Id__c' },
        { label: 'Vendor ID', fieldName: 'Vendor_Id__c' },
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

    @wire(getTransactions)
    wiredTransactions(result) {
        this.wiredTransactionsResult = result;
        const { data, error } = result;
        if (data) {
            this.data = data.map(record => ({
                ...record,
                CreatedAt__c: this.formatDate(record.CreatedAt__c),
                UpdatedAt__c: this.formatDate(record.UpdatedAt__c)
            }));
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.data = [];
            this.showToast('Error', error.body?.message || 'An error occurred while fetching transactions', 'error');
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleString();
        } catch (error) {
            return '';
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
        this.upsertLabel = 'Edit';
        this.currentTransaction = { ...row };
        this.isEditModalOpen = true;
    }

    handleInsert() {
        this.upsertLabel = 'Insert';
        this.currentTransaction = {}; // Clear the current transaction for new entry
        
        // Pre-populate some default values
        this.currentTransaction.Code__c = '';  // Set some default values if needed
        this.isEditModalOpen = true; // Open the modal for new entry
    }

    handleDelete(row) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            deleteTransaction({ transactionId: row.Id })
                .then(() => {
                    this.showToast('Success', 'Transaction deleted successfully', 'success');
                    return this.refreshData();
                })
                .catch(error => {
                    this.showToast('Error', error.body?.message || 'An error occurred while deleting the transaction', 'error');
                });
        }
    }

    handleModalClose() {
        this.isEditModalOpen = false;
        this.currentTransaction = {};
    }

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        this.currentTransaction = { ...this.currentTransaction, [field]: value };
    }

    handleSaveTransaction() {
        const fields = {};

        // Fill the fields with values from the modal form
        const editableFields = [
            'Code__c', 'Content__c', 'Mode__c', 'Order_Id__c',
            'Status__c', 'Name', 'Type__c', 'User_Id__c',
            'Vendor_Id__c'
        ];

        editableFields.forEach(field => {
            if (this.currentTransaction[field] !== undefined) {
                fields[field] = this.currentTransaction[field];
            }
        });

        // If no ID is provided, create a new record
        if (!this.currentTransaction.Id) {
            const recordInput = { apiName: TRANS_OBJECT.objectApiName, fields };

            createRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Transaction added successfully', 'success');
                    this.isEditModalOpen = false;
                    return this.refreshData();
                })
                .catch(error => {
                    this.showToast('Error', error.body?.message || 'An error occurred while adding the transaction', 'error');
                });
        } else {
            // Otherwise, update the existing record
            fields.Id = this.currentTransaction.Id;
            const recordInput = { fields };

            updateRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Transaction updated successfully', 'success');
                    this.isEditModalOpen = false;
                    return this.refreshData();
                })
                .catch(error => {
                    this.showToast('Error', error.body?.message || 'An error occurred while updating the transaction', 'error');
                });
        }
    }

    refreshData() {
        return refreshApex(this.wiredTransactionsResult);
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
}
