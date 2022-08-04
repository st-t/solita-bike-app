// solita-bike-app
// End to end tests - Adding new data

describe("E2E - create stations and journeys [with datasets]", () => 
{
    const queryTimeout = 7000;

    before( () => {
        cy.viewport(1120, 1000);

        cy.visit("http://localhost:3000/create");
        cy.contains('City-bike-app', { timeout: queryTimeout }).should('be.visible');
    });

    // Create a journey 
    it("should set and create new journey data", () => {
        cy.viewport(1120, 1000);

        cy.get('[data-cy="c_dep"]').click();
        cy.get('[data-name="departure"]', { timeout: 3000 }).should('be.visible');
        cy.get('[data-name="departure"]').type('hana');

        cy.get('[data-cy="dr_dep"]', { timeout: 3000 }).eq(0).should('be.visible');
        cy.get('[data-cy="dr_dep"]', { timeout: 3000 }).eq(0).click();

        cy.get('.react-datepicker__input-container').eq(0).click();
        cy.get('.react-datepicker__day--002').eq(0).click();
        cy.get('.react-datepicker__time-list-item').eq(2).click();

        cy.get('[data-cy="c_ret"]').click();
        cy.get('[data-name="return"]', { timeout: 3000 }).should('be.visible');
        cy.get('[data-name="return"]').type('silta');

        cy.get('[data-cy="dr_dep"]', { timeout: 3000 }).eq(10).should('be.visible');
        cy.get('[data-cy="dr_dep"]', { timeout: 3000 }).eq(10).click();

        cy.get('.react-datepicker__input-container').eq(1).click();
        cy.get('.react-datepicker__day--003').eq(1).click();
        cy.get('.react-datepicker__time-list-item').eq(15).click();

        // Journey data should exist 
        for (let i = 0; i <= 5; i++) 
        {
            cy.viewport(1120, 1000);
            cy.get('[data-cy="new_j_data"]', { timeout: 500 }).eq(i).invoke('text').should('have.length.greaterThan', 1);
        }
        
        // Press apply 
        cy.get('[data-cy="create-j"]', { timeout: 1000 })
        .should('have.css', 'background-color').and('eq', 'rgba(72, 199, 76, 0.267)');
        cy.get('[data-cy="create-j"]').click();

        cy.get('[data-cy="s_notif"]', { timeout: queryTimeout }).should('be.visible');
    });

    // Create a station
    it("should set and create new station", () => {
        cy.viewport(1120, 1000);

        cy.get('[data-cy="map-create-stat"]').click();
        cy.get('[data-cy="in-name"]').type('cypress name');
        cy.get('[data-cy="in-addr"]').type('cypress address');
        cy.get('[data-cy="in-city"]').type('cypress city');

        cy.get('[data-cy="create-j2"]', { timeout: 1000 })
        .should('have.css', 'background-color').and('eq', 'rgba(72, 199, 76, 0.267)');
        cy.get('[data-cy="create-j2"]').click();

        cy.get('[data-cy="s_notif"]', { timeout: queryTimeout }).should('be.visible');
    });

    // Check if added station is there 
    it("should see newly created station in list", () => {
        cy.viewport(1120, 1000);

        cy.visit("http://localhost:3000/stations");
        cy.contains('City-bike-app', { timeout: queryTimeout }).should('be.visible');

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

        cy.contains('cypress name', { timeout: queryTimeout });
    });
});