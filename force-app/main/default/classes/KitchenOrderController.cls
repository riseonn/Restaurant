public class KitchenOrderController {

    // Fetch all orders
    @AuraEnabled(cacheable=true)
    public static List<Order__c> getAllOrders() {
        try {
            return [SELECT Id, OrderNumber__c, OrderStatus__c, CreatedDate FROM Order__c ORDER BY CreatedDate DESC];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching orders: ' + e.getMessage());
        }
    }

    // Create a new order
    @AuraEnabled
    public static Order__c createOrder(Decimal orderNumber, String orderStatus) {
        try {
            Order__c newOrder = new Order__c();
            newOrder.OrderNumber__c = orderNumber;
            newOrder.OrderStatus__c = orderStatus;
            insert newOrder;
            return newOrder;
        } catch (Exception e) {
            throw new AuraHandledException('Error creating order: ' + e.getMessage());
        }
    }
}
