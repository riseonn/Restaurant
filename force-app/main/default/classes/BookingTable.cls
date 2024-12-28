public with sharing class BookingTable {
    // Method to retrieve bookings from the custom Booking_Table__c object
    @AuraEnabled(cacheable=true)
    public static List<Booking_Table__c> getBookings() {
        try {
            return [
                SELECT BTID__c,
                       Name,
                       First_Name__c,
                       Last_Name__c,
                       Middle_Name__c,
                       Email__c,
                       Mobile__c,
                       User_Id__c,
                       Status__c,
                       CreatedById,
                       LastModifiedById,
                       OwnerId,
                       Line_1__c,
                       Line_2__c,
                       City__c,
                       Province__c,
                       Country__c,
                       Content__c,
                       Table_Id__c,
                       Token__c
                FROM Booking_Table__c
                LIMIT 50
            ];
        } catch (Exception e) {
            // Log the error
            System.debug('Error retrieving bookings: ' + e.getMessage());
            
            // Throw a more descriptive AuraHandledException
            throw new AuraHandledException('Unable to retrieve bookings: ' + e.getMessage());
        }
    }
    
    // Method to update booking records
    @AuraEnabled
    public static void updateBooking(List<Booking_Table__c> bookingList) {
        if (bookingList == null || bookingList.isEmpty()) {
            throw new AuraHandledException('No bookings to update.');
        }

        try {
            // Perform update operation for the list of bookings
            update bookingList;
        } catch (Exception e) {
            // Log the full error details
            System.debug('Update Booking Error: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());

            throw new AuraHandledException('Failed to update booking(s): ' + e.getMessage());
        }
    }
    
    // Method to delete booking from the custom Booking_Table__c object
    @AuraEnabled
    public static void deleteBooking(Id bookingId) {
        if (bookingId == null) {
            throw new AuraHandledException('Booking ID cannot be null');
        }
        
        try {
            // Delete the Booking_Table__c record using the provided Id
            delete [SELECT Id FROM Booking_Table__c WHERE Id = :bookingId LIMIT 1];
        } catch (Exception e) {
            // Log the error
            System.debug('Delete Booking Error: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());
            
            throw new AuraHandledException('Failed to delete booking: ' + e.getMessage());
        }
    }
}