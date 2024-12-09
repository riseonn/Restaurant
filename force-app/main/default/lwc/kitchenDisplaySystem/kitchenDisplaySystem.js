import { LightningElement, wire } from 'lwc'; // LightningElement is the base class for all LWC components, wire is used to connect the component to data
import { ShowToastEvent } from 'lightning/platformShowToastEvent'; // Used to display toast messages
import getOrderItems from '@salesforce/apex/OrderItemController.getOrderItems'; // Apex method to fetch order items

export default class MyComponent extends LightningElement {
    // Column definitions for the table
    columns = [
        { 
            label: 'Order ID',    // Column label for the Order ID
            fieldName: 'OTID__c',   // Display the "index" field for Order ID
            type: 'number',         // The data type for this column is text
            sortable: true        // Enable sorting for this column
        },
        { 
            label: 'Last Name',  // Column label for the Order Name
            fieldName: 'Last_Name__c',    // Corresponding field in the data
            type: 'text',         // The data type for this column is text
            sortable: true        // Enable sorting for this column
        },
        { 
            label: 'Total Bill',  // Column label for the Ordered Items
            fieldName: 'Total__c',  // Corresponding field for Ordered Items
            type: 'number',       // The data type for this column is text
            sortable: true        // Enable sorting for this column
        }
    ];
    
    data = [];  // Holds the order item data to be displayed in the table
    defaultSortDirection = 'asc';  // Default sorting direction is ascending
    sortDirection = 'asc';   // Current sort direction
    sortedBy = 'index';      // Default column to sort by is 'index' (Order ID)
    error = null;            // Holds any error information

    // Wire service to call the Apex method and fetch order items data
    @wire(getOrderItems)
    wiredOrderItems({ error, data }) {
        if (data) {  // If data is successfully fetched
            // Modify the data to include an 'index' field for displaying the Order ID
            this.data = data;
            //data.map((item, index) => ({
             //   ...item,
             //   index: index + 1  // Adds an "index" field to display the iterating number (starts from 1)
            //}));
            this.error = undefined;  // Clear any existing error
        } else if (error) {  // If there’s an error fetching data
            this.error = error;  // Store the error
            this.data = [];      // Clear any existing data
            // Display a toast message to indicate an error
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Unable to fetch order items',  // Custom error message
                    variant: 'error'  // Type of toast (error in this case)
                })
            );
        }
    }

    // Getter to check if there’s data available for display
    get hasData() {
        return this.data && this.data.length > 0;  // Returns true if data exists and is not empty
    }

    // Event handler to handle column sorting
    handleSort(event) {
        const { fieldName, sortDirection } = event.detail;  // Destructuring the sort details from the event
        this.sortedBy = fieldName;  // Update the column being sorted
        this.sortDirection = sortDirection;  // Update the sort direction (ascending/descending)
        this.sortData(fieldName, sortDirection);  // Call the sorting function
    }

    // Function to sort the data based on the selected column and sort direction
    sortData(fieldName, sortDirection) {
        const parseData = [...this.data];  // Create a shallow copy of the data to avoid mutating the original array
        parseData.sort((a, b) => {
            let valueA = a[fieldName];  // Get the value of the field for record a
            let valueB = b[fieldName];  // Get the value of the field for record b
            
            // Sorting for numeric values
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return (sortDirection === 'asc') ? valueA - valueB : valueB - valueA;  // Sort in ascending or descending order
            }
            
            // Sorting for string values
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                valueA = valueA.toLowerCase();  // Convert to lowercase for case-insensitive sorting
                valueB = valueB.toLowerCase();
                return (sortDirection === 'asc') 
                    ? (valueA > valueB ? 1 : -1)  // Ascending sort
                    : (valueA < valueB ? 1 : -1); // Descending sort
            }
            
            return 0;  // Default return if values are not comparable
        });
        this.data = parseData;  // Update the data property with sorted data
    }
}
