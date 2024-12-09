public with sharing class KitchenOrderController {

    // Apex method to create a new KitchenOrder
    @AuraEnabled
    public static KitchenOrder__c createOrder(String orderNumber, String orderStatus) {
        // Ensure the newStatus is one of the valid statuses
        List<String> validStatuses = new List<String>{'Pending', 'In Progress', 'Completed'};
        if (!validStatuses.contains(orderStatus)) {
            throw new AuraHandledException('Invalid order status');
        }

        // Create a new KitchenOrder__c record
        KitchenOrder__c newOrder = new KitchenOrder__c();
        newOrder.OrderStatus__c = orderStatus;  // Set the order status

        // If OrderNumber__c is an auto-number field, do not assign it manually
        // newOrder.OrderNumber__c = orderNumber;  // REMOVE this line if OrderNumber__c is auto-number

        // Insert the new order
        insert newOrder;

        // Return the created order object (can be used to update the UI after creation)
        return newOrder;
    }

    // Apex method to update the order status
    @AuraEnabled
    public static void updateOrderStatus(Id orderId, String newStatus) {
        // Ensure the newStatus is one of the valid statuses
        List<String> validStatuses = new List<String>{'Pending', 'In Progress', 'Completed'};
        if (!validStatuses.contains(newStatus)) {
            throw new AuraHandledException('Invalid status value');
        }

        // Retrieve the order and update the status
        KitchenOrder__c order = [SELECT Id, OrderStatus__c FROM KitchenOrder__c WHERE Id = :orderId LIMIT 1];
        order.OrderStatus__c = newStatus;
        update order;
    }

    // Apex method to get all orders
    @AuraEnabled(cacheable=true)
    public static List<KitchenOrder__c> getAllOrders() {
        return [SELECT Id, OrderNumber__c, OrderStatus__c, CreatedDate FROM KitchenOrder__c ORDER BY CreatedDate DESC];
    }
}
