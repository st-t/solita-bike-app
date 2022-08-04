

describe("E2E - journeys [with datasets]", () => {

    before( () => {
        cy.viewport(1120, 1000);

        cy.visit("http://localhost:3000");
        cy.contains('City-bike-app', { timeout: 6000 }).should('be.visible');
    });

    it("next page should load", () => {
        cy.viewport(1120, 1000);

        cy.get('[data-cy="srch"]', { timeout: 6000 }).should('be.visible');

        cy.get('[data-cy="next"]', { timeout: 6000 })
        .should('have.css', 'color').and('eq', 'rgb(100, 100, 100)');

        cy.get('[data-cy="next"]').click();
        cy.get('[data-cy="srch"]', { timeout: 6000 }).should('be.visible');
    });

    it("previous page should load", () => {
        cy.viewport(1120, 1000);

        cy.get('[data-cy="srch"]', { timeout: 6000 }).should('be.visible');

        cy.get('[data-cy="prev"]', { timeout: 6000 })
        .should('have.css', 'color').and('eq', 'rgb(100, 100, 100)');

        cy.get('[data-cy="prev"]').click();
        cy.get('[data-cy="srch"]', { timeout: 6000 }).should('be.visible');
    });

    it("journey search should work", () => {
        cy.viewport(1120, 1000);

        cy.get('[data-cy="srch"]', { timeout: 6000 }).should('be.visible').type('pasila{enter}');
        cy.contains('Pasilan asema', { timeout: 6000 });
    });

    it("journey should expand", () => {
        cy.viewport(1120, 1000);
        
        cy.get('[data-cy="expand"]', { timeout: 6000 }).should('be.visible');
        cy.get('[data-cy="expand"]').eq(0).click();
        cy.get('[data-cy="map-route"]', { timeout: 6000 }).should('be.visible');
    });



    
})