public with sharing class UserTable {
    /**
     * Retrieves a list of users
     * @return List of User records
     */
    @AuraEnabled(cacheable=true)
    public static List<User_Table__c> getAgents() {
        try {
            return [
                SELECT 
                utId__c,
                Agent__c,
                Chef__c,
                CreatedById,
                Email__c,
                First_Name__c,
                Intro__c,
                Last_Login__c,
                LastModifiedById,
                Last_Name__c,
                Middle_Name__c,
                Mobile__c,
                OwnerId,
                Profile__c,
                Registered_At__c,
                Name,
                Vendor__c
                FROM User_Table__c
                ORDER BY CreatedDate DESC
                LIMIT 50
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving users: ' + e.getMessage());
        }
    }

    /**
     * Deletes a specific user
     * @param userId ID of the user to be deleted
     */
    @AuraEnabled
    public static void deleteAgent(Id userId) {
        try {
            // Note: Deleting standard User records is typically not allowed
            // You might want to deactivate the user instead
            User userToUpdate = new User(Id = userId, IsActive = false);
            update userToUpdate;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating user: ' + e.getMessage());
        }
    }
}