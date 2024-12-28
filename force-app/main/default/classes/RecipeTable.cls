public with sharing class RecipeTable {
    
    /**
     * Retrieves a list of Recipe records
     * @return List of Recipe_Table__c records
     */
    @AuraEnabled(cacheable=true)
    public static List<Recipe_Table__c> getRecipes() {
        try {
            return [
                SELECT 
                    RPID__c, 
                    CreatedById, 
                    RPIND__c, 
                    Instructions__c, 
                    RPITD__c, 
                    LastModifiedById, 
                    OwnerId, 
                    Quantity__c, 
                    Name, 
                    Unit__c 
                FROM Recipe_Table__c 
                ORDER BY CreatedDate DESC
                LIMIT 50
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving recipes: ' + e.getMessage());
        }
    }

    /**
     * Deletes a specific Recipe record
     * @param recipeId ID of the recipe to be deleted
     */
    @AuraEnabled
    public static void deleteRecipe(Id recipeId) {
        try {
            Recipe_Table__c recipeToDelete = [SELECT Id FROM Recipe_Table__c WHERE Id = :recipeId LIMIT 1];
            delete recipeToDelete;
        } catch (Exception e) {
            throw new AuraHandledException('Error deleting recipe: ' + e.getMessage());
        }
    }
    
    /**
     * Updates the Recipe record with the provided fields
     * @param recipe Recipe object with updated fields
     */
    @AuraEnabled
    public static void updateRecipe(Recipe_Table__c recipe) {
        try {
            update recipe;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating recipe: ' + e.getMessage());
        }
    }

    /**
     * Creates a new Recipe record
     * @param recipe Recipe object to be created
     * @return The newly created Recipe record
     */
    @AuraEnabled
    public static Recipe_Table__c createRecipe(Recipe_Table__c recipe) {
        try {
            insert recipe;
            return recipe;
        } catch (Exception e) {
            throw new AuraHandledException('Error creating recipe: ' + e.getMessage());
        }
    }
}
