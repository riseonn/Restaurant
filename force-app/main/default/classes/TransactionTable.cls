public with sharing class TransactionTable {
    @AuraEnabled(cacheable=true)
    public static List<Transaction_Table__c> getTransactions() {
        try {
            if (!Schema.sObjectType.Transaction_Table__c.isAccessible()) {
                throw new SecurityException('Insufficient permissions to read transactions');
            }
            
            return [
                SELECT 
                    Id,
                    TNID__c,
                    Code__c,
                    Content__c,
                    CreatedById,
                    CreatedDate,
                    LastModifiedById,
                    Mode__c,
                    Order_Id__c,
                    OwnerId,
                    Status__c,
                    Name,
                    Type__c,
                    LastModifiedDate,
                    User_Id__c,
                    Vendor_Id__c
                FROM Transaction_Table__c
                WITH SECURITY_ENFORCED
                ORDER BY CreatedDate DESC
                LIMIT 50
            ];
        } catch (QueryException qe) {
            throw new AuraHandledException('Error querying transactions: ' + qe.getMessage());
        } catch (SecurityException se) {
            throw new AuraHandledException('Insufficient permissions: ' + se.getMessage());
        } catch (Exception e) {
            throw new AuraHandledException('Unexpected error: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void deleteTransaction(Id transactionId) {
        if (transactionId == null) {
            throw new AuraHandledException('Transaction ID cannot be null');
        }

        try {
            if (!Schema.sObjectType.Transaction_Table__c.isDeletable()) {
                throw new SecurityException('Insufficient permissions to delete transactions');
            }

            List<Transaction_Table__c> transactionsToDelete = [
                SELECT Id 
                FROM Transaction_Table__c 
                WHERE Id = :transactionId 
                WITH SECURITY_ENFORCED 
                LIMIT 1
            ];
            
            if (transactionsToDelete.isEmpty()) {
                throw new AuraHandledException('Transaction not found');
            }
            
            delete transactionsToDelete[0];

        } catch (QueryException qe) {
            throw new AuraHandledException('Error finding transaction: ' + qe.getMessage());
        } catch (SecurityException se) {
            throw new AuraHandledException('Security error: ' + se.getMessage());
        } catch (DmlException de) {
            throw new AuraHandledException('Error deleting transaction: ' + de.getMessage());
        } catch (Exception e) {
            throw new AuraHandledException('Unexpected error: ' + e.getMessage());
        }
    }
}
