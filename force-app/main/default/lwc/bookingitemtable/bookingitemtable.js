
import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { updateRecord } from 'lightning/uiRecordApi';
import getBookingItems from '@salesforce/apex/BookingItemTable.getBookingItems';
import deleteBookingItem from '@salesforce/apex/BookingItemTable.deleteBookingItem';
import updateBookingItem from '@salesforce/apex/BookingItemTable.updateBookingItem';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class BookingItemTable extends NavigationMixin(LightningElement) {
    @track data = [];
    wiredBookingItemsResult;
    isEditModalOpen = false;
    @track currentBookingItem = {};

    // Status options for the Status dropdown
    statusOptions = [
        { label: 'Pending', value: 'Pending' },
        { label: 'Confirmed', value: 'Confirmed' },
        { label: 'Shipped', value: 'Shipped' },
        { label: 'Delivered', value: 'Delivered' },
        { label: 'Cancelled', value: 'Cancelled' }
    ];

    // Columns for the data table
    columns = [
        { label: 'BOTD', fieldName: 'BOTD__c' },
        { label: 'Booking ID', fieldName: 'Booking_Id__c' },
        { label: 'Name', fieldName: 'Name' },
        { label: 'Content', fieldName: 'Content__c' },
        { label: 'Created By', fieldName: 'CreatedById' },
        { label: 'Discount', fieldName: 'discount__c' },
        { label: 'Item ID', fieldName: 'Item_Id__c' },
        { label: 'Last Modified By', fieldName: 'LastModifiedById' },
        { label: 'Owner ID', fieldName: 'OwnerId' },
        { label: 'Price', fieldName: 'Price__c' },
        { label: 'Quantity', fieldName: 'Quantity__c' },
        { label: 'Unit', fieldName: 'Unit__c' },
        { label: 'SKU', fieldName: 'SKU__c' },
        { label: 'Status', fieldName: 'Status__c' },
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

    // Fetch booking items using wire service
    @wire(getBookingItems)
    wiredBookingItems(result) {
        this.wiredBookingItemsResult = result;
        const { data, error } = result;
        if (data) {
            this.data = data;
        } else if (error) {
            this.showToast('Error', 'Failed to fetch booking items', 'error');
        }
    }

    // Handle row actions (Edit/Delete)
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

    // Open edit modal for a specific row
    handleEdit(row) {
        if (!row) {
            console.error('Error: No row data available for editing.');
            return;
        }
   
        // Create a deep copy of the order data to prevent mutations
        this.currentBookingItem = { ...row };
        this.isEditModalOpen = true;
    }

    // Handle input changes in the edit modal
    handleInputChange(event) {
        const { name, value } = event.target;
        console.log(name, value);

        this.currentBookingItem = {
            ...this.currentBookingItem,
            [name]: value
        };
    }

    // Validate fields before saving
    validateFields() {
        const { Name, Price__c, Quantity__c, Status__c } = this.currentBookingItem;

        if (!Name) {
            this.showToast('Error', 'Name is required', 'error');
            return false;
        }

        if (!Status__c) {
            this.showToast('Error', 'Status is required', 'error');
            return false;
        }

        if (Price__c !== null && (isNaN(Price__c) || Price__c < 0)) {
            this.showToast('Error', 'Price must be a positive number', 'error');
            return false;
        }

        if (Quantity__c !== null && (isNaN(Quantity__c) || Quantity__c < 0)) {
            this.showToast('Error', 'Quantity must be a positive number', 'error');
            return false;
        }

        return true;
    }

    // Handle saving the booking item
    handleSaveBookingItem() {
        if (!this.validateFields()) {
            return;
        }

        const fields = { ...this.currentBookingItem };

        updateBookingItem({ bookingItem: fields })
        .then(() => {
            this.showToast('Success', 'Booking item updated successfully', 'success');
            this.isEditModalOpen = false;
            return this.refreshData();
        })
        .catch((error) => {
            let errorMessage = error.body ? error.body.message : 'Unknown error';
            this.showToast('Error', `Failed to update booking item: ${errorMessage}`, 'error');
        });
    }

    // Handle modal close
    handleModalClose() {
        this.isEditModalOpen = false;
    }

    // Delete a booking item
    handleDelete(row) {
        deleteBookingItem({ bookingItemId: row.Id })
            .then(() => {
                this.showToast('Success', 'Booking item deleted successfully', 'success');
                return this.refreshData();
            })
            .catch((error) => {
                this.showToast('Error', `Failed to delete booking item: ${error.body.message}`, 'error');
            });
    }    

    // Handle creating a new Booking Item
    handleNewBookingItem() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Booking_Item_Table__c',
                actionName: 'new'
            }
        }).catch(error => {
            console.error('Navigation error:', error);
            this.showToast('Error', 'Unable to navigate to new booking item page', 'error');
        });
    }

    // Refresh the data in the table
    refreshData() {
        return refreshApex(this.wiredBookingItemsResult);
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
