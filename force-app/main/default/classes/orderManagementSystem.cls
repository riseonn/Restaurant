public with sharing class OrderManagementSystem {

    // Method to retrieve orders based on their status
    @AuraEnabled(cacheable=true)
    public static List<Order_Table__c> getOrderData() {
        try {
            return [
                SELECT Id,
                       Last_Name__c,
                       Total__c,
                       City__c,
                       Country__c,
                       Created_At__c,
                       CreatedById,
                       Discount__c,
                       Email__c,
                       First_Name__c,
                       Grand_Total__c,
                       OTID__c,
                       Item_Discount__c,
                       LastModifiedById,
                       Line_1__c,
                       Line_2__c,
                       Middle_Name__c,
                       Mobile__c,
                       OwnerId,
                       Promo__c,
                       Province__c,
                       Shipping__c,
                       Status__c,
                       Sub_Total__c,
                       Tax__c,
                       Token__c,
                       Updated_At__c,
                       User_Id__c,
                       Vendor_Id__c
                FROM Order_Table__c
                WHERE Status__c IN ('New', 'Processing', 'Ready', 'Served')
                LIMIT 100
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving order data: ' + e.getMessage());
        }
    }

    // Method to update order records
    @AuraEnabled
    public static void updateOrder(List<Order_Table__c> orderList) {
        if (orderList == null || orderList.isEmpty()) {
            throw new AuraHandledException('No orders to update.');
        }

        try {
            // Perform update operation for the list of orders
            update orderList;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update order(s): ' + e.getMessage());
        }
    }

    // Method to delete order from the custom Order_Table__c object
    @AuraEnabled
    public static void deleteOrder(Id orderId) {
        if (orderId == null) {
            throw new AuraHandledException('Order ID cannot be null');
        }

        try {
            Order_Table__c orderToDelete = [
                SELECT Id
                FROM Order_Table__c
                WHERE Id = :orderId
                LIMIT 1
            ];

            if (orderToDelete != null) {
                delete orderToDelete;
            } else {
                throw new AuraHandledException('Order not found for the provided ID.');
            }
        } catch (Exception e) {
            throw new AuraHandledException('Failed to delete order: ' + e.getMessage());
        }
    }
}