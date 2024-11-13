import { LightningElement, wire } from 'lwc';
import getMenuItems from '@salesforce/apex/MenuController.getMenuItems';

export default class CustomerMenu extends LightningElement {
    menuItems = [];
    isLoading = true;

    @wire(getMenuItems)
    wiredMenuItems({ error, data }) {
        if (data) {
            this.menuItems = data;
            this.isLoading = false;
        } else if (error) {
            this.isLoading = false;
            console.error('Error fetching menu items:', error);
        }
    }
}
