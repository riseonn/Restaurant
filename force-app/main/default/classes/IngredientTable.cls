// Apex Class: IngredientTable.cls
public with sharing class IngredientTable {
    @AuraEnabled(cacheable=true)
    public static List<Ingredient_Table__c> getIngredients() {
        try {
            return [
                SELECT 
                    Id, itid__c, User_Id__c, Content__c, 
                    Quantity__c, SKU__c, Slug__c, Summary__c, Title__c, 
                    Type__c, Unit__c, Vendor_Id__c,
                    User_Id__r.UTID__c,
                    User_Id__r.Name
                FROM Ingredient_Table__c
                WHERE User_Id__c != null
                ORDER BY User_Id__c DESC
                LIMIT 50
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching ingredients: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<User_Table__c> getUsers() {
        try {
            return [
                SELECT Id, Name, UTID__c
                FROM User_Table__c
                ORDER BY Name
                LIMIT 100
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching users: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void updateIngredient(Ingredient_Table__c ingredient) {
        if (ingredient == null) {
            throw new AuraHandledException('No ingredient to update.');
        }
        try {
            // Verify User_Id__c exists
            List<User_Table__c> users = [
                SELECT Id 
                FROM User_Table__c 
                WHERE Id = :ingredient.User_Id__c 
                LIMIT 1
            ];
            if (users.isEmpty()) {
                throw new AuraHandledException('Invalid User ID provided.');
            }
            update ingredient;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update ingredient: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void deleteIngredient(Id ingredientId) {
        if (ingredientId == null) {
            throw new AuraHandledException('Ingredient ID cannot be null');
        }
        try {
            Ingredient_Table__c ingredientToDelete = [
                SELECT Id
                FROM Ingredient_Table__c
                WHERE Id = :ingredientId
                LIMIT 1
            ];
            delete ingredientToDelete;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to delete ingredient: ' + e.getMessage());
        }
    }
}
