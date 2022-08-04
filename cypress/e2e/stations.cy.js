// solita-bike-app
// End to end tests - Stations 

describe("E2E - stations [with datasets]", () => 
{
    const queryTimeout = 7000;

    before( () => {
        cy.viewport(1120, 1000);

        cy.visit("http://localhost:3000/stations");
        cy.contains('City-bike-app', { timeout: queryTimeout }).should('be.visible');
    });

    // Test pagescrolls
    const arr_pref = ['next', 'previous'];
    const arr_pages = ['next', 'prev'];

    for (let i = 0; i <= 1; i++) 
    {
        it("should load " + arr_pref[i] + " page", () => {
            cy.viewport(1120, 1000);

            cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');

            cy.get('[data-cy="'+arr_pages[i]+'"]', { timeout: queryTimeout })
            .should('have.css', 'color').and('eq', 'rgb(100, 100, 100)');

            cy.get('[data-cy="'+arr_pages[i]+'"]').click();
            cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
            cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');
            cy.get('[data-cy="no_res"]').should('not.exist');
        });
    }
    
    // Go to the last page 
    it("should load last page", () => {
        cy.viewport(1120, 1000);

        // Wait for pageload
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        
        // Button for last page should be available
        cy.get('[data-cy="last"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgb(61, 61, 61)');
        
        // Click and wait for load
        cy.get('[data-cy="last"]').click();
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        
        // Button should be disabled
        cy.get('[data-cy="last"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgba(161, 21, 21, 0.67)');
        cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="no_res"]').should('not.exist');
    });

    // Check that previous page works on last page
    it("should load previous page after last page", () => {
        cy.viewport(1120, 1000);

        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');

        cy.get('[data-cy="prev"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgb(100, 100, 100)');

        cy.get('[data-cy="prev"]').click();
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="no_res"]').should('not.exist');
    });

    // Check that we can go back to last page 
    it("should load last page back", () => {
        cy.viewport(1120, 1000);

        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');

        cy.get('[data-cy="next"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgb(100, 100, 100)');

        cy.get('[data-cy="next"]').click();
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');

        // Button should be disabled since we should be on the last page again
        cy.get('[data-cy="last"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgba(161, 21, 21, 0.67)');
        cy.get('[data-cy="no_res"]').should('not.exist');
    });

    it("should load first page", () => {
        cy.viewport(1120, 1000);

        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');

        cy.get('[data-cy="first"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgb(61, 61, 61)');

        cy.get('[data-cy="first"]').click();
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');

        // Button should be disabled since we are on the first page
        cy.get('[data-cy="first"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgba(161, 21, 21, 0.67)');
        cy.get('[data-cy="no_res"]').should('not.exist');
    });

    it("should find searched term", () => {
        cy.viewport(1120, 1000);

        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible').type('pasila{enter}');
        cy.contains('Pasilan asema', { timeout: queryTimeout });
    });
});