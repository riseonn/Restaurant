import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { createRecord, updateRecord } from 'lightning/uiRecordApi';
import BOOK_OBJECT from '@salesforce/schema/Booking_Table__c'; // Import Booking_Table__c schema
import getBookings from '@salesforce/apex/BookingTable.getBookings';
import deleteBooking from '@salesforce/apex/BookingTable.deleteBooking';

export default class BookingTable extends NavigationMixin(LightningElement) {
    @track bookings = [];
    @track currentBooking = {};
    @track isModalOpen = false;
    @track isInsertMode = false; // Track if it's insert mode or edit mode
    wiredBookingsResult;

    // Status options for dropdown
    statusOptions = [
        { label: 'Preparing', value: 'Preparing' },
        { label: 'Ready', value: 'Ready' },
        { label: 'On Hold', value: 'On Hold' },
        { label: 'Served', value: 'Served' },
        { label: 'Delivered', value: 'Delivered' },
        { label: 'Cancelled', value: 'Cancelled' }
    ];

    // Table columns configuration
    columns = [
        { label: 'Booking ID', fieldName: 'BTID__c' },
        { label: 'Name', fieldName: 'Name' },
        { label: 'First Name', fieldName: 'First_Name__c' },
        { label: 'Last Name', fieldName: 'Last_Name__c' },
        { label: 'Middle Name', fieldName: 'Middle_Name__c' },
        { label: 'Mobile', fieldName: 'Mobile__c' },
        { label: 'Email', fieldName: 'Email__c' },
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

    // Fetch bookings using wire service
    @wire(getBookings)
    wireBookings(result) {
        this.wiredBookingsResult = result;
        if (result.data) {
            this.bookings = result.data;
        } else if (result.error) {
            this.showToast('Error', 'Failed to load bookings', 'error');
        }
    }

    // Handle row actions (edit/delete)
    handleRowAction(event) {
        const action = event.detail.action.name;
        const row = event.detail.row;

        switch (action) {
            case 'edit':
                this.openEditModal(row);
                break;
            case 'delete':
                this.deleteBookingRecord(row);
                break;
        }
    }

    // Open modal for editing or inserting
    openEditModal(booking) {
        this.isInsertMode = false;
        this.currentBooking = { ...booking };
        this.isModalOpen = true;
    }

    // Open modal for inserting a new booking
    handleAddNew() {
        this.isInsertMode = true; // Indicate insert mode
        this.currentBooking = {}; // Clear the current booking object for a new entry
        this.isModalOpen = true; // Open the modal
    }

    // Handle input changes in modal
    handleInputChange(event) {
        const { name, value } = event.target;
        this.currentBooking[name] = value;
    }

    // Save booking changes (insert or update)
    saveBooking() {
        if (!this.validateBooking()) return;

        const fields = { 
            Id: this.currentBooking.Id, 
            ...this.currentBooking 
        };

        if (this.isInsertMode) {
            // Create a new booking using createRecord from lightning/uiRecordApi
            const recordInput = { apiName: BOOK_OBJECT.objectApiName, fields };
            createRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Booking created successfully', 'success');
                    this.closeModal();
                    this.refreshBookings();
                })
                .catch(error => {
                    this.showToast('Error', 'Failed to create booking', 'error');
                    console.error('Insert Error:', error);
                });
        } else {
            // Update an existing booking using updateRecord from lightning/uiRecordApi
            const recordInput = { fields };
            updateRecord(recordInput)
                .then(() => {
                    this.showToast('Success', 'Booking updated successfully', 'success');
                    this.closeModal();
                    this.refreshBookings();
                })
                .catch(error => {
                    this.showToast('Error', 'Failed to update booking', 'error');
                    console.error('Update Error:', error);
                });
        }
    }

    // Validate booking before saving
    validateBooking() {
        const { First_Name__c, Last_Name__c, Email__c } = this.currentBooking;
        
        if (!First_Name__c || !Last_Name__c) {
            this.showToast('Validation Error', 'First and Last Name are required', 'error');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!Email__c || !emailRegex.test(Email__c)) {
            this.showToast('Validation Error', 'Valid email is required', 'error');
            return false;
        }

        return true;
    }

    // Delete booking record
    deleteBookingRecord(booking) {
        deleteBooking({ bookingId: booking.Id })
            .then(() => {
                this.showToast('Success', 'Booking deleted successfully', 'success');
                this.refreshBookings();
            })
            .catch(error => {
                this.showToast('Error', 'Failed to delete booking', 'error');
                console.error('Delete Error:', error);
            });
    }

    // Close modal
    closeModal() {
        this.isModalOpen = false;
        this.currentBooking = {};
    }

    // Refresh bookings list
    refreshBookings() {
        return refreshApex(this.wiredBookingsResult);
    }

    // Show toast notification
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    // Navigate to new booking page
    navigateToNewBooking() {
        this[NavigationMixin.Navigate]( {
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Booking_Table__c',
                actionName: 'home'
            }
        });
    }
}
