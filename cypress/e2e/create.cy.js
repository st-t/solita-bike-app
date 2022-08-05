// solita-bike-app
// End to end tests - Adding new data
// Execute with MySQL configured and datasets loaded

describe("E2E - create stations and journeys [with datasets]", () => 
{
    const queryTimeout = 7000;

    // Before the test load the site 
    before( () => {
        cy.viewport(1120, 1000);

        cy.visit("http://localhost:3000/create");
        cy.contains('City-bike-app', { timeout: queryTimeout }).should('be.visible');
    });

    // Create a new journey with durations/distances and all
    it("should set and create new journey data", () => {
        cy.viewport(1120, 1000);

        // Wait for input to show and write 
        cy.get('[data-cy="c_dep"]').click();
        cy.get('[data-name="departure"]', { timeout: 3000 }).should('be.visible');
        cy.get('[data-name="departure"]').type('hana');
        
        // Click on first station result
        cy.get('[data-cy="dr_dep"]', { timeout: 3000 }).eq(0).should('be.visible');
        cy.get('[data-cy="dr_dep"]', { timeout: 3000 }).eq(0).click();
        
        // Set departure date
        cy.get('.react-datepicker__input-container').eq(0).click();
        cy.get('.react-datepicker__day--002').eq(0).click();
        cy.get('.react-datepicker__time-list-item').eq(2).click();

        // Wait for return section to open and write input
        cy.get('[data-cy="c_ret"]').click();
        cy.get('[data-name="return"]', { timeout: 3000 }).should('be.visible');
        cy.get('[data-name="return"]').type('silta');

        // Select station result 
        cy.get('[data-cy="dr_dep"]', { timeout: 3000 }).eq(10).should('be.visible');
        cy.get('[data-cy="dr_dep"]', { timeout: 3000 }).eq(10).click();
        
        // Write return date 
        cy.get('.react-datepicker__input-container').eq(1).click();
        cy.get('.react-datepicker__day--003').eq(1).click();
        cy.get('.react-datepicker__time-list-item').eq(15).click();

        // All journey data should now exist 
        for (let i = 0; i <= 5; i++) 
        {
            cy.viewport(1120, 1000);
            cy.get('[data-cy="new_j_data"]', { timeout: 500 }).eq(i).invoke('text').should('have.length.greaterThan', 1);
        }
        
        // Press apply and wait for success message from server
        cy.get('[data-cy="create-j"]', { timeout: 1000 })
        .should('have.css', 'background-color').and('eq', 'rgba(72, 199, 76, 0.267)');
        cy.get('[data-cy="create-j"]').click();

        cy.get('[data-cy="s_notif"]', { timeout: queryTimeout }).should('be.visible');
    });

    // Create a station
    it("should set and create new station", () => {
        cy.viewport(1120, 1000);

        // Click on the map to set coordinates and write some inputs
        cy.get('[data-cy="map-create-stat"]').click();
        cy.get('[data-cy="in-name"]').type('cypress name');
        cy.get('[data-cy="in-addr"]').type('cypress address');
        cy.get('[data-cy="in-city"]').type('cypress city');

        // Create button should be now available, click it 
        cy.get('[data-cy="create-j2"]', { timeout: 1000 })
        .should('have.css', 'background-color').and('eq', 'rgba(72, 199, 76, 0.267)');
        cy.get('[data-cy="create-j2"]').click();
        
        // Wait for success message
        cy.get('[data-cy="s_notif"]', { timeout: queryTimeout }).should('be.visible');
    });

    // Check if added station went into database 
    it("should see newly created station in list", () => {
        cy.viewport(1120, 1000);

        // Load stations 
        cy.visit("http://localhost:3000/stations");
        cy.contains('City-bike-app', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        
        // Button for last page should be available
        cy.get('[data-cy="last"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgb(61, 61, 61)');
        
        // Goto last page and wait for it to load
        cy.get('[data-cy="last"]').click();
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        
        // Wait until we are on the last page
        cy.get('[data-cy="last"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgba(161, 21, 21, 0.67)');
        cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="no_res"]').should('not.exist');
        
        // Our added station should exist 
        cy.contains('cypress name', { timeout: queryTimeout });
    });
});