// solita-bike-app
// End to end tests - Journeys 
// Execute with MySQL configured and datasets loaded

describe("E2E - journeys [with datasets]", () => 
{
    const queryTimeout = 7000;

    // Wait for the page to load
    before( () => {
        cy.viewport(1120, 1000);

        cy.visit("http://localhost:3000");
        cy.contains('City-bike-app', { timeout: queryTimeout }).should('be.visible');
    });

    // Test pagescrolls
    const arr_pref = ['next', 'previous'];
    const arr_pages = ['next', 'prev'];

    // See if we can load pages
    for (let i = 0; i <= 1; i++) 
    {
        it("should load " + arr_pref[i] + " page", () => {
            cy.viewport(1120, 1000);
            
            // Wait for the page to load 
            cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
            
            // Pagescroll button should be available
            cy.get('[data-cy="'+arr_pages[i]+'"]', { timeout: queryTimeout })
            .should('have.css', 'color').and('eq', 'rgb(100, 100, 100)');
            
            // Click on it and wait for the site to load
            cy.get('[data-cy="'+arr_pages[i]+'"]').click();
            cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
            cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');

            // There should not be an error message (no results)
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

        // Wait for the page to load 
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');

        // Button should be available 
        cy.get('[data-cy="prev"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgb(100, 100, 100)');

        // Click and wait for loaded, check that there's no error message 
        cy.get('[data-cy="prev"]').click();
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="no_res"]').should('not.exist');
    });

    // Check that we can go back to last page 
    it("should load last page back", () => {
        cy.viewport(1120, 1000);

        // Wait for page to load
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');

        // Button should be available 
        cy.get('[data-cy="next"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgb(100, 100, 100)');

        // Click it and wait till its loaded
        cy.get('[data-cy="next"]').click();
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');

        // Button should be now disabled since we should be on the last page 
        cy.get('[data-cy="last"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgba(161, 21, 21, 0.67)');
        cy.get('[data-cy="no_res"]').should('not.exist');
    });

    it("should load first page", () => {
        cy.viewport(1120, 1000);

        // Wait for the page to load 
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        
        // Button for first page should be available since we are now on the last page 
        cy.get('[data-cy="first"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgb(61, 61, 61)');

        // Click it and wait for the page to load 
        cy.get('[data-cy="first"]').click();
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');

        // Button should be disabled since we are on the first page
        cy.get('[data-cy="first"]', { timeout: queryTimeout })
        .should('have.css', 'color').and('eq', 'rgba(161, 21, 21, 0.67)');
        cy.get('[data-cy="no_res"]').should('not.exist');
    });

    // Test column sorts 
    const arr_c = ['', 'departure', 'return', 'distance', 'duration'];

    for (let i = 1; i <= 4; i++) 
    {
        it("should sort by column " + arr_c[i], () => {
            cy.viewport(1120, 1000);

            // Wait for the page to load 
            cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');

            // Click on sort column 
            cy.get('[data-cy="sort"]').eq(i).click();
            cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
            cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');

            // There should not be an error message (no results)
            cy.get('[data-cy="no_res"]').should('not.exist');
        });
    }

    // Test whole filtering system 
    // Data to find filter elements 
    const num = ['5000', '60'];
    const sort = ['meters', 'seconds'];
    const elem = ['distf', 'distd'];
    const arr = ['under', 'over'];
    const arr_y = ['distance', 'duration'];

    for (let y = 0; y <= 1; y++) 
    {
        for (let i = 0; i <= 1; i++) 
        {
            it("should filter results " + arr[i] + " " + arr_y[y], () => {
                cy.viewport(1120, 1000);
                
                // Wait for page to load and click on cogwheel
                cy.get('[data-cy="cog"]', { timeout: queryTimeout }).should('be.visible');
                cy.get('[data-cy="cog"]').click();

                // Check filter checkbox 
                cy.get('[data-cy="'+elem[y]+'"]', { timeout: queryTimeout }).should('exist');
                cy.get('[data-cy="'+elem[y]+'"]').check({force: true});
                
                // <over> and <under> buttons, test both of them 
                if(!i) cy.get('[data-tg-off="over"]').eq(y).click();
                else cy.get('[data-tg-on="under"]').eq(y).click();
                if(!i) cy.get('[data-name="'+sort[y]+'"]').type(num[y]);
                
                // Apply should be now visible, click it 
                cy.get('[data-cy="applyf"]', { timeout: queryTimeout })
                .should('have.css', 'background-color').and('eq', 'rgba(72, 199, 76, 0.267)');
                cy.get('[data-cy="applyf"]').click();

                // Wait for page to load and check that there's no error message 
                cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
                cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');
                cy.get('[data-cy="no_res"]').should('not.exist');
            });
        }
    }

    // Check that searchbox is working 
    it("should find searched term", () => {
        cy.viewport(1120, 1000);

        // Search for a station that should exist after importing datasets
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible').type('pasila{enter}');
        cy.contains('Pasilan asema', { timeout: queryTimeout });
    });

    // Open a journey column and check that maps load 
    it("should expand journey column", () => {
        cy.viewport(1120, 1000);
        
        cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="expand"]').eq(0).click();
        cy.get('[data-cy="map-route"]', { timeout: queryTimeout }).should('be.visible');
    });
})