import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord, createRecord } from 'lightning/uiRecordApi';
import getAgents from '@salesforce/apex/UserTable.getAgents';
import deleteAgent from '@salesforce/apex/UserTable.deleteAgent';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import USERTABLE_OBJECT from '@salesforce/schema/User_Table__c';

export default class UserTable extends NavigationMixin(LightningElement) {
    @track data = [];
    wiredAgentsResult;
    isEditModalOpen = false;
    @track currentUser = {};
    @track upsertLabel = 'Edit';

    columns = [
        { label: 'User ID', fieldName: 'utId__c' },
        { label: 'First Name', fieldName: 'First_Name__c' },
        { label: 'Middle Name', fieldName: 'Middle_Name__c' },
        { label: 'Last Name', fieldName: 'Last_Name__c' },
        { label: 'Mobile', fieldName: 'Mobile__c' },
        { label: 'Email', fieldName: 'Email__c' },
        { label: 'Profile', fieldName: 'Profile__c' },
        { label: 'Registered At', fieldName: 'Registered_At__c' },
        { label: 'Last Login', fieldName: 'Last_Login__c' },
        { label: 'Created By', fieldName: 'CreatedById' },
        { label: 'Last Modified By', fieldName: 'LastModifiedById' },
        { label: 'Owner ID', fieldName: 'OwnerId' },
        { label: 'Vendor', fieldName: 'Vendor__c' },
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

    @wire(getAgents)
    wiredAgents(result) {
        this.wiredAgentsResult = result;
        const { data, error } = result;
        if (data) {
            this.data = data;
        } else if (error) {
            this.showToast('Error', 'Failed to fetch agents', 'error');
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
        this.currentUser = { ...row };
        this.isEditModalOpen = true;
    }

    handleInputChange(event) {
        const { name, value } = event.target;

        const fieldMap = {
            'firstName': 'First_Name__c',
            'middleName': 'Middle_Name__c',
            'lastName': 'Last_Name__c',
            'mobile': 'Mobile__c',
            'email': 'Email__c',
            'profile': 'Profile__c',
            'lastLogin': 'Last_Login__c',
            'registeredAt': 'Registered_At__c',
            'vendor': 'Vendor__c',
            'utId': 'utId__c',
            'agent': 'Agent__c',
            'chef': 'Chef__c',
            'ownerId': 'OwnerId',
            'createdBy': 'CreatedById'
        };

        const fieldName = fieldMap[name];
        if (fieldName) {
            this.currentUser = {
                ...this.currentUser,
                [fieldName]: value
            };
        }
    }

    validateFields() {
        const { First_Name__c, Last_Name__c, Email__c, Profile__c } = this.currentUser;

        if (!First_Name__c || !Last_Name__c) {
            this.showToast('Error', 'First Name and Last Name are required.', 'error');
            return false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!Email__c || !emailPattern.test(Email__c)) {
            this.showToast('Error', 'Email is required and should have a valid domain.', 'error');
            return false;
        }

        if (!Profile__c) {
            this.showToast('Error', 'Profile is required.', 'error');
            return false;
        }

        return true;
    }

    handleSaveUser() {
        if (!this.validateFields()) {
            return;
        }

        const fields = {
            First_Name__c: this.currentUser.First_Name__c,
            Middle_Name__c: this.currentUser.Middle_Name__c,
            Last_Name__c: this.currentUser.Last_Name__c,
            Mobile__c: this.currentUser.Mobile__c,
            Email__c: this.currentUser.Email__c,
            Profile__c: this.currentUser.Profile__c,
            Last_Login__c: this.currentUser.Last_Login__c,
            Registered_At__c: this.currentUser.Registered_At__c,
            Vendor__c: this.currentUser.Vendor__c
        };

        if (!this.currentUser.Id) {
            const recordInput = { apiName: USERTABLE_OBJECT.objectApiName, fields };

            createRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'User added successfully', 'success');
                    this.isEditModalOpen = false;
                    this.refreshData();
                })
                .catch((error) => {
                    const errorMessage = error.body?.message || 'Failed to add user';
                    this.showToast('Error', errorMessage, 'error');
                });
        } else {
            fields.Id = this.currentUser.Id;
            const recordInput = { fields };

            updateRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'User updated successfully', 'success');
                    this.isEditModalOpen = false;
                    this.refreshData();
                })
                .catch((error) => {
                    const errorMessage = error.body?.message || 'Failed to update user';
                    this.showToast('Error', errorMessage, 'error');
                });
        }
    }

    handleModalClose() {
        this.isEditModalOpen = false;
    }

    handleDelete(row) {
        deleteAgent({ agentId: row.Id })
            .then(() => {
                this.showToast('Success', 'User deleted successfully', 'success');
                this.refreshData();
            })
            .catch((error) => {
                const errorMessage = error.body?.message || 'Failed to delete user';
                this.showToast('Error', errorMessage, 'error');
            });
    }

    handleAddNew() {
        this.upsertLabel = 'Insert';
        this.currentUser = {}; // Reset the current user for new entry
        this.isEditModalOpen = true;
    }

    refreshData() {
        return refreshApex(this.wiredAgentsResult);
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
