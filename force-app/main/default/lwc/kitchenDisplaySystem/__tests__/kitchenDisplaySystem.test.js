import { createElement } from '@lwc/engine-dom';
import KitchenDisplaySystem from 'c/kitchenDisplaySystem';

const mockOrder = {
    Id: '001',
    Name: 'Test Order',
    Status__c: 'New',
    Items__r: {
        records: [
            {
                Id: 'item1',
                Name: 'Item 1',
                Status__c: 'Pending'
            }
        ]
    }
};

// Mock the apex methods
jest.mock(
    '@salesforce/apex/KitchenDisplaySystemController.getOrders',
    () => {
        return {
            default: jest.fn(() => Promise.resolve([mockOrder]))
        };
    },
    { virtual: true }
);

describe('c-kitchen-display-system', () => {
    beforeEach(() => {
        // Create a shallow clone of the template
        const element = createElement('c-kitchen-display-system', {
            is: KitchenDisplaySystem
        });
        document.body.appendChild(element);
    });

    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        // Clear all mock implementations
        jest.clearAllMocks();
    });

    it('should create component', () => {
        // Arrange
        const element = document.querySelector('c-kitchen-display-system');

        // Assert
        expect(element).not.toBeNull();
    });

    it('should render orders when data is loaded', async () => {
        // Arrange
        const element = document.querySelector('c-kitchen-display-system');

        // Act
        // Wait for any asynchronous operations to complete
        await Promise.resolve();
        
        // Assert
        const orderElements = element.shadowRoot.querySelectorAll('.order-card');
        expect(orderElements.length).toBe(1);
    });

    it('should handle error state', async () => {
        // Arrange
        const element = document.querySelector('c-kitchen-display-system');
        
        // Modify the mock to simulate an error
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Act
        const error = new Error('Test error');
        await element.handleError(error);
        
        // Assert
        expect(element.error).toBeTruthy();
    });
});