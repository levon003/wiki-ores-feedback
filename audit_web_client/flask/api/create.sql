USE s5660__oidb;
DROP TABLE IF EXISTS revision;

CREATE TABLE page_metadata (
    page_id INT NOT NULL,
    wiki_namespace INT NOT NULL,
    page_name TEXT NOT NULL,
    rev_count INT NOT NULL,
    PRIMARY KEY (page_id)
);

CREATE TABLE revision (
    rev_id INT NOT NULL,
    page_id INT NOT NULL,
    prev_rev_id INT NOT NULL,
    
    is_minor BOOLEAN NOT NULL,
    rev_timestamp TIMESTAMP NOT NULL,
    prev_rev_timestamp TIMESTAMP NOT NULL,

    username VARCHAR(85) NOT NULL,  -- https://en.wikipedia.org/wiki/Wikipedia:Naming_conventions_(technical_restrictions)
    is_user_registered BOOLEAN NOT NULL,
    is_user_bot BOOLEAN NOT NULL,
    n_user_contributions_at_rev INT NOT NULL,

    damaging_pred FLOAT,
    goodfaith_pred FLOAT,

    PRIMARY KEY (rev_id),
    FOREIGN KEY (page_id) REFERENCES page_metadata (page_id),
);

/*
These tables are for page category information
*/
CREATE TABLE category_name (
    category_id INT NOT NULL,
    category_name TEXT NOT NULL,
    PRIMARY KEY (category_id)
);
CREATE TABLE page_category (
    id INT NOT NULL AUTO_INCREMENT,
    category_id INT NOT NULL,
    page_id INT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (category_id) REFERENCES category_name (category_id),
    FOREIGN KEY (page_id) REFERENCES page_metadata (page_id),
);

