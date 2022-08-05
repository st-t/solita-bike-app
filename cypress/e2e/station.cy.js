// solita-bike-app
// End to end tests - Station view
// Execute with MySQL configured and datasets loaded

describe("E2E - station view [with datasets]", () => 
{
    const queryTimeout = 7000;

    // Before the test load stations page first
    before( () => {
        cy.viewport(1120, 1000);

        cy.visit("http://localhost:3000/stations");
        cy.contains('City-bike-app', { timeout: queryTimeout }).should('be.visible');
    });

    it("should click on the first station", () => {
        cy.viewport(1120, 1000);

        // Click a station so we can get into single station view 
        cy.get('[data-cy="srch"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="expand"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="s_link"]').eq(0).click();
    });

    // Station stats should load now, so see if text exists in elements
    for (let i = 0; i <= 3; i++) 
    {
        it("should load station data column " + (i+1), () => {
            cy.viewport(1120, 1000);
            cy.get('[data-cy="s_stat"]', { timeout: queryTimeout }).eq(0).invoke('text').should('have.length.greaterThan', 1);
        });
    }

    for (let i = 0; i <= 4; i++) 
    {
        it("should load top return station " + (i+1), () => {
            cy.viewport(1120, 1000);
            cy.get('[data-cy="s_top_rlink"]', { timeout: queryTimeout }).eq(i).should('be.visible');
        });
    }

    for (let i = 0; i <= 4; i++) 
    {
        it("should load top departure station " + (i+1), () => {
            cy.viewport(1120, 1000);
            cy.get('[data-cy="s_top_dlink"]', { timeout: queryTimeout }).eq(i).should('be.visible');
        });
    }

    // Test time range filter on station view 
    it("should filter data results ", () => {
        cy.viewport(1120, 1000);

        // Cogwheel should be there, click it and wait for calendar
        cy.get('[data-cy="cog_s"]', { timeout: queryTimeout }).should('be.visible');
        cy.get('[data-cy="cog_s"]').click();
        cy.get('[data-cy="datef"]', { timeout: queryTimeout }).should('exist');
        cy.get('[data-cy="datef"]').check({force: true});

        // Click on calendar days 2 to 3 
        cy.get('.react-datepicker__day--002').eq(0).click();
        cy.get('.react-datepicker__day--003').eq(0).click();

        // Apply button should now be there, click it 
        cy.get('[data-cy="applyf"]', { timeout: queryTimeout })
        .should('have.css', 'background-color').and('eq', 'rgba(72, 199, 76, 0.267)');
        cy.get('[data-cy="applyf"]').click();

        // Wait for top departure station link to load 
        cy.get('[data-cy="s_top_dlink"]', { timeout: queryTimeout }).eq(0).should('be.visible');
    });

    // Map should now load 
    it("should load map marker ", () => {
        cy.viewport(1120, 1000);
        cy.get('[data-cy="map-marker"]', { timeout: queryTimeout }).should('be.visible');
    });
});