public with sharing class kitchenDisplaySystem {
    @AuraEnabled(cacheable=true)
    public static List<Order_Table__c> getOrderData() {
        try {
            return [
                SELECT Id,
                       Last_Name__c,
                       Total__c,
                       Email__c,
                       First_Name__c,
                       OTID__c,
                       Middle_Name__c,
                       Order__c,
                       Status__c,
                       OwnerId,
                       Owner.FirstName,
                       Owner.LastName,
                       Preparation_Time__r.Time_In_Minutes__c,   
                       Preparation_Time__r.Name
                FROM Order_Table__c
                WHERE Status__c IN ('New', 'Processing', 'Ready', 'Served')
                LIMIT 100
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving order data: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Preparation_Time__c> getPreparationTimes() {
        try {
            return [
                SELECT Id, Name, Time_In_Minutes__c
                FROM Preparation_Time__c
                ORDER BY Time_In_Minutes__c ASC
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving preparation times: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void updateOrderPrepTime(Id orderId, Id prepTimeId) {
        try {
            Order_Table__c order = new Order_Table__c(
                Id = orderId,
                Preparation_Time__c = prepTimeId
            );
            update order;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating preparation time: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void updateOrder(List<Order_Table__c> orderList) {
        if (orderList == null || orderList.isEmpty()) {
            throw new AuraHandledException('No orders to update.');
        }

        try {
            update orderList;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update order(s): ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void claimOrder(Id orderId) {
        try {
            // Get the current user's ID
            Id userId = UserInfo.getUserId();
            
            // Query the order
            Order_Table__c order = [
                SELECT Id, Status__c, OwnerId
                FROM Order_Table__c 
                WHERE Id = :orderId 
                LIMIT 1
            ];
            
            // Update the order with user ID and change status to Processing
            order.Status__c = 'Processing';
            order.OwnerId = userId;
            
            update order;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to claim order: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void unclaimOrder(Id orderId) {
        try {
            // Get the current user's ID
            Id defaultOwnerId = UserInfo.getUserId();

            // Query the order
            Order_Table__c order = [
                SELECT Id, Status__c, OwnerId
                FROM Order_Table__c
                WHERE Id = :orderId
                LIMIT 1
            ];

            // Remove user assignment and change status to 'New'

            order.Status__c = 'New';

            // Update the order
            update order;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to unclaim order: ' + e.getMessage());
        }
    }

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

            if (orderToDelete != null && orderToDelete.Id != null) {
                delete orderToDelete;
            } else {
                throw new AuraHandledException('Order not found for the provided ID.');
            }
        } catch (Exception e) {
            throw new AuraHandledException('Failed to delete order: ' + e.getMessage());
        }
    }

    public static void notifyNewOrders(List<Id> orderIds) {
        // Logic to handle new orders notification
        System.debug('New Orders ID: ' + orderIds);
        
        // Further logic for notifying the kitchen system (email, platform event, etc.)
    }

    public static void handleNewOrders(List<Order_Table__c> orders) {
        // Get the list of IDs for new orders
        List<Id> newOrderIds = new List<Id>();
        for (Order_Table__c order : orders) {
            if (order.Status__c == 'New') {
                newOrderIds.add(order.Id);
            }
        }

        // Call the method to notify the kitchen display system
        if (!newOrderIds.isEmpty()) {
            notifyNewOrders(newOrderIds);
        }
    }
}
