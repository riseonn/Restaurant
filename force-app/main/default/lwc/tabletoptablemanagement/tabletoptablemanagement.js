import { LightningElement, track, wire } from 'lwc';
import { updateRecord, createRecord } from 'lightning/uiRecordApi';
import getTableTopRecords from '@salesforce/apex/TableTopTable.getTableTopRecords';
import deleteTableTop from '@salesforce/apex/TableTopTable.deleteTableTop';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import TableTop_OBJECT from '@salesforce/schema/TableTop_Table__c';

export default class TableTopTable extends LightningElement {
    @track data = [];
    @track error;
    @track isEditModalOpen = false;
    wiredTableTopResult;
    @track currentTableTop = {};
    @track upsertLabel = 'Edit';

    columns = [
        { label: 'Table ID', fieldName: 'TTID__c' },
        { label: 'Capacity', fieldName: 'Capacity__c' },
        { label: 'Code', fieldName: 'Code__c' },
        { label: 'Content', fieldName: 'Content__c' },
        { label: 'Status', fieldName: 'Status__c' },
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

    @wire(getTableTopRecords)
    wiredTableTop(result) {
        this.wiredTableTopResult = result;
        const { data, error } = result;
        if (data) {
            this.data = data.map(record => ({
                ...record,
                CreatedAt__c: this.formatDate(record.Created_At__c),
                UpdatedAt__c: this.formatDate(record.Updated_At__c)
            }));
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.data = [];
            this.showToast('Error', error.body?.message || 'An error occurred while fetching data', 'error');
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
        this.currentTableTop = { ...row };
        this.isEditModalOpen = true;
    }

    handleAddNew() {
        this.upsertLabel = 'Insert';
        this.currentTableTop = {};  
        this.isEditModalOpen = true;
    }

    handleDelete(row) {
        if (confirm('Are you sure you want to delete this table top?')) {
            deleteTableTop({ tableTopId: row.Id })
                .then(() => {
                    this.showToast('Success', 'Table top deleted successfully', 'success');
                    this.refreshData();
                })
                .catch((error) => {
                    this.showToast('Error', `Failed to delete table top: ${error.body.message}`, 'error');
                });
        }
    }

    handleModalClose() {
        this.isEditModalOpen = false;
        this.currentTableTop = {};
    }

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.target.value;
        this.currentTableTop = { ...this.currentTableTop, [field]: value };
    }

    handleSaveTableTop() {
        // Debugging to verify what is in currentTableTop
        console.log('currentTableTop before validation:', this.currentTableTop);

        const fields = {};
        const editableFields = ['TTID__c', 'Capacity__c', 'Code__c', 'Content__c', 'Status__c'];

        editableFields.forEach(field => {
            if (this.currentTableTop[field] !== undefined) {
                fields[field] = this.currentTableTop[field];
            }
        });

        if (!this.currentTableTop.Id) {
            const recordInput = { apiName: TableTop_OBJECT.objectApiName, fields };
            createRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Table top added successfully', 'success');
                    this.isEditModalOpen = false;
                    this.refreshData();
                })
                .catch(error => {
                    this.showToast('Error', error.body?.message || 'An error occurred while adding the record', 'error');
                });
        } else {
            fields.Id = this.currentTableTop.Id;
            const recordInput = { fields };

            updateRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Table top updated successfully', 'success');
                    this.isEditModalOpen = false;
                    this.refreshData();
                })
                .catch(error => {
                    this.showToast('Error', error.body?.message || 'An error occurred while updating the record', 'error');
                });
        }
    }

    refreshData() {
        return refreshApex(this.wiredTableTopResult);
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
