public with sharing class BookingItemTable {
    @TestVisible private static final String ERROR_NO_ACCESS = 'Insufficient access rights to booking items.';

    @AuraEnabled(cacheable=true)
    public static List<Booking_Item_Table__c> getBookingItems() {
        // Check CRUD permissions
        if (!Booking_Item_Table__c.SObjectType.getDescribe().isAccessible()) {
            throw new AuraHandledException(ERROR_NO_ACCESS);
        }

        try {
            return [
                SELECT Id, 
                       BOTD__c, 
                       Booking_Id__c, 
                       Name, 
                       Content__c, 
                       CreatedById, 
                       Discount__c, 
                       Item_Id__c, 
                       LastModifiedById, 
                       OwnerId, 
                       Price__c, 
                       Quantity__c, 
                       SKU__c, 
                       Status__c, 
                       Unit__c
                FROM Booking_Item_Table__c
                WITH SECURITY_ENFORCED
                LIMIT 50
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Failed to fetch booking items: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void updateBookingItem(Booking_Item_Table__c bookingItem) {
        // Check update permissions
        if (!Booking_Item_Table__c.SObjectType.getDescribe().isUpdateable()) {
            throw new AuraHandledException(ERROR_NO_ACCESS);
        }

        if (bookingItem == null) {
            throw new AuraHandledException('No booking item to update.');
        }

        try {
            update bookingItem;
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to update booking item: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void deleteBookingItem(Id bookingItemId) {
        // Check delete permissions
        if (!Booking_Item_Table__c.SObjectType.getDescribe().isDeletable()) {
            throw new AuraHandledException(ERROR_NO_ACCESS);
        }

        try {
            delete [SELECT Id FROM Booking_Item_Table__c WHERE Id = :bookingItemId];
        } catch (DmlException e) {
            throw new AuraHandledException('Failed to delete booking item: ' + e.getMessage());
        }
    }
}
