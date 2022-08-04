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

});