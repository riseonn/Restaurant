public with sharing class kitchenDisplaySystem {
    @AuraEnabled(cacheable=true)
    public static List<Order_Table__c> getOrderData() {
        try {
            return [
                SELECT Id,
                       Last_Name__c,
                       Total__c,
                       City__c,
                       Content__c,
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
                       User_Id__c,
                       Vendor_Id__c,                       
                       User_Id__r.First_Name__c,
                       User_Id__r.Last_Name__c,
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

    // Method to update a list of order records
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

    // Method to delete an order from the custom Order_Table__c object
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
}
