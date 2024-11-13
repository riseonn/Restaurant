import { LightningElement, wire, track } from 'lwc';
import getMenuItems from '@salesforce/apex/MenuController.getMenuItems';

export default class CustomerMenuController extends LightningElement {
    @track menuItems = [];
    @track error;
    @track isLoading = true;
    @track categoriesWithItems = [];

    // Using wire service to fetch menu items
    @wire(getMenuItems)
    wiredMenuItems({ error, data }) {
        this.isLoading = true;
        if (data) {
            this.menuItems = data.map(item => ({
                id: item.Id,
                name: item.Name,
                description: item.Description__c,
                price: item.Price__c,
                category: item.Category__c,
                formattedPrice: this.formatPrice(item.Price__c)
            }));
            this.error = undefined;
            this.processCategories();  // Process the items by category after data is loaded
        } else if (error) {
            this.error = error;
            this.menuItems = [];
            console.error('Error fetching menu items:', error);
        }
        this.isLoading = false;
    }

    // Method to process menu items and group them by category
    processCategories() {
        // Get unique categories from menuItems
        const categories = [...new Set(this.menuItems.map(item => item.category))];

        // Create an array of objects, each containing a category and its corresponding items
        this.categoriesWithItems = categories.map(category => {
            return {
                category: category,
                items: this.menuItems.filter(item => item.category === category)
            };
        });
    }

    // Method to format price
    formatPrice(price) {
        return `$${price.toFixed(2)}`;  // Simple price formatting
    }

    // Method to handle menu item selection
    handleMenuItemSelect(event) {
        const selectedItemId = event.currentTarget.dataset.itemId;
        const selectedItem = this.menuItems.find(item => item.id === selectedItemId);
        
        if (selectedItem) {
            // Dispatch custom event with selected item details
            this.dispatchEvent(new CustomEvent('menuitemselect', {
                detail: {
                    item: selectedItem
                }
            }));
        }
    }

    // Error handling methods
    get hasError() {
        return this.error != null;
    }

    get errorMessage() {
        return this.error?.body?.message || 'An unexpected error occurred';
    }
}
