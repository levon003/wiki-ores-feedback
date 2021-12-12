import React, { useState, useEffect, useMemo } from 'react';
import Grid from '@material-ui/core/Grid';

import CircularProgress from '@material-ui/core/CircularProgress';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import throttle from 'lodash/throttle';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Popover,
  TextField,
  Typography,
  IconButton,
  useTheme
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import HelpIcon from '@material-ui/icons/Help'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import DefaultFilters from './DefaultFilters';
const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkboxCheckedIcon = <CheckBoxIcon fontSize="small" />;

const PageFilterControls = ({className, onChange, pageValues, setPageValues, namespaceSelected, setNameSpaceSelected, linkedToValues, setLinkedToValues, linkedFromValues, setLinkedFromValues, pageAnchorEl, setPageAnchorEl, preDefinedSelected, ...rest }) => {
  const theme = useTheme()

  const pageButtonStyle = (pageValues.length !== 0 || namespaceSelected !== DefaultFilters.defaultNamespaceSelected || linkedToValues.length !== 0 || linkedFromValues.length !== 0) && preDefinedSelected === null ? {backgroundColor: theme.palette.primary.main, color: 'white'} : {}
  const [linkedToInputValue, setLinkedToInputValue] = useState('')
  const [linkedToOptions, setLinkedToOptions] = useState([])

  const [pageInputValue, setPageInputValue] = useState('');
  const [options, setOptions] = useState([]);

  const [linkedFromInputValue, setLinkedFromInputValue] = useState('')
  const [linkedFromOptions, setLinkedFromOptions] = useState([])

  const [open, setOpen] = useState(false);
  const [isActiveQuery, setActiveQuery] = useState(false);
  const loading = open && isActiveQuery;

  const [linkedToOpen, setLinkedToOpen] = useState(false);
  const [linkedToActiveQuery, setLinkedToActiveQuery] = useState(false);
  const linkedToLoading = linkedToOpen && linkedToActiveQuery;

  const [linkedFromOpen, setLinkedFromOpen] = useState(false);
  const [linkedFromActiveQuery, setLinkedFromActiveQuery] = useState(false);
  const linkedFromLoading = linkedFromOpen && linkedFromActiveQuery;

  const [pageHelpPopup, setPageHelpPopup] = useState();

  const pageFilterOpen = Boolean(pageAnchorEl);
  const id = pageFilterOpen ? 'simple-popover' : undefined;

  const namespaces = [ 
    { namespace: "Main/Article - 0"},
    { namespace: "Talk - 1"},
    { namespace: "User - 2"},
    { namespace: "User talk - 3"},
    { namespace: "Wikipedia - 4"},
    { namespace: "Wikipedia talk - 5"},
    { namespace: "File - 6"},
    { namespace: "File talk - 7"},
    { namespace: "MediaWiki - 8"},
    { namespace: "MediaWiki talk - 9"},
    { namespace: "Template - 10"},
    { namespace: "Template talk - 11"},
    { namespace: "Help - 12"},
    { namespace: "Help talk - 13"},
    { namespace: "Category - 14"},
    { namespace: "Category talk - 15"},
    { namespace: "Portal - 100"},
    { namespace: "Portal talk - 101"},
    { namespace: "Draft - 118"},
    { namespace: "Draft talk - 119"}
  ]
  
  const handlePageChipClick = (event) => {
    setPageAnchorEl(event.currentTarget)
  }

  const handlePagePopoverClose = () => {
    setPageAnchorEl(null)
  }

  const pageHelpOpen = Boolean(pageHelpPopup);
  const helpID = pageHelpOpen ? 'simple-popover' : undefined;

  const handleIconClick = (event) => {
    setPageHelpPopup(event.currentTarget)
  }

  const handleIconClickClose = () => {
    setPageHelpPopup(null)
  }

  const handlePageFilterReset = (event) => {
    setNameSpaceSelected (DefaultFilters.defaultNamespaceSelected); 
    setPageValues([])
    setLinkedToValues([])
    setLinkedFromValues([])
};

  const specificThrottledAutocompleteFetch = useMemo(
    () =>
      throttle((request, callback) => {
        setActiveQuery(true);
        const page_autocomplete_url = '/api/autocomplete/page_title?query=' + encodeURI(request.input);
        fetch(page_autocomplete_url, {method: 'GET'})
          .then(res => res.json())
          .then(data => data.options)
          .then(callback);
      }, 200),
    [],
  );
  const linkedToThrottledAutocompleteFetch = useMemo(
    () =>
      throttle((request, callback) => {
        setLinkedToActiveQuery(true);
        const page_autocomplete_url = '/api/autocomplete/page_title?query=' + encodeURI(request.input);
        fetch(page_autocomplete_url, {method: 'GET'})
          .then(res => res.json())
          .then(data => data.options)
          .then(callback);
      }, 200),
    [],
  );
  const linkedFromThrottledAutocompleteFetch = useMemo(
    () =>
      throttle((request, callback) => {
        setLinkedFromActiveQuery(true);
        const page_autocomplete_url = '/api/autocomplete/page_title?query=' + encodeURI(request.input);
        fetch(page_autocomplete_url, {method: 'GET'})
          .then(res => res.json())
          .then(data => data.options)
          .then(callback);
      }, 200),
    [],
  );

  // use effect for specific page filters
  useEffect(() => {
    let active = true;

    if (pageInputValue === '') {
      setOptions(pageValues.length > 0 ? pageValues : []);
      return undefined;
    }

    specificThrottledAutocompleteFetch({ input: pageInputValue }, (results) => {
      if (active) {
        let newOptions = [];

        if (pageValues.length > 0) {
          newOptions = pageValues;
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
        setActiveQuery(false);
      }
    });

    return () => {
      active = false;
      setActiveQuery(false);
    };
  }, [pageValues, pageInputValue, specificThrottledAutocompleteFetch]);
  
  // use effect for linked to autocomplete
  useEffect(() => {
    let active = true;

    if (linkedToInputValue === '') {
      setLinkedToOptions(linkedToValues.length > 0 ? linkedToValues : []);
      return undefined;
    }

    linkedToThrottledAutocompleteFetch({ input: linkedToInputValue }, (results) => {
      if (active) {
        let newOptions = [];

        if (linkedToValues.length > 0) {
          newOptions = linkedToValues;
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setLinkedToOptions(newOptions);
        setLinkedToActiveQuery(false);
      }
    });

    return () => {
      active = false;
      setLinkedToActiveQuery(false);
    };
  }, [linkedToValues, linkedToInputValue, linkedToThrottledAutocompleteFetch]);

  // use effect for linked from autocomplete
  useEffect(() => {
    let active = true;

    if (linkedFromInputValue === '') {
      setLinkedToOptions(linkedFromValues.length > 0 ? linkedFromValues : []);
      return undefined;
    }

    linkedFromThrottledAutocompleteFetch({ input: linkedFromInputValue }, (results) => {
      if (active) {
        let newOptions = [];

        if (linkedFromValues.length > 0) {
          newOptions = linkedFromValues;
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setLinkedFromOptions(newOptions);
        setLinkedFromActiveQuery(false);
      }
    });

    return () => {
      active = false;
      setLinkedFromActiveQuery(false);
    };
  }, [linkedFromValues, linkedFromInputValue, linkedFromThrottledAutocompleteFetch]);

  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);
  useEffect(() => {
    if (!linkedToOpen) {
      setLinkedToOptions([]);
    }
  }, [linkedToOpen]);
  useEffect(() => {
    if (!linkedFromOpen) {
      setLinkedFromOptions([]);
    }
  }, [linkedFromOpen]);

  // const getAutocompleteOptions = (queryString) => {
  //   // TODO ensure this is safe to delete
  //   const page_autocomplete_url = '/api/autocomplete/page_title?query=' + encodeURI(queryString);
  //   fetch(page_autocomplete_url, {method: 'GET'})
  //     .then(res => res.json())
  //     .then(data => {
  //       console.log(data.options);
  //       return data.options;
  //     });
  // }

  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="nowrap">
      <Button className="text-h3" variant="outlined" style={pageButtonStyle} onClick={handlePageChipClick}>Page Filters<KeyboardArrowDownIcon/></Button>
      <IconButton className="tooltip-margin" color="primary" size="small" onClick={handleIconClick}>
        <HelpIcon/>
      </IconButton>
      <Popover
        id={helpID}
        open={pageHelpOpen}
        anchorEl={pageHelpPopup}
        onClose={handleIconClickClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <p style={{margin: 5, fontSize: 12}}>
          Page Filters Popup Placeholder
          {/* TODO: add something here */}
        </p>
      </Popover>
      <Popover
        id={id}
        open={pageFilterOpen}
        anchorEl={pageAnchorEl}
        onClose={handlePagePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}>
    <Autocomplete
      multiple
      id="specific-site-filter"
      style={{ width: 300 }}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.primary_text)}
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={pageValues}
      onChange={(event, newValues) => {
        setOptions(newValues ? [...newValues, ...options] : options);
        setPageValues(newValues);
        // TODO call onChange with new set of filter criteria
      }}
      onInputChange={(event, newInputValue) => {
        setPageInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField {...params} 
          label="Specific page titles" 
          variant="outlined" 
          fullWidth 
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
          />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip label={option.primary_text} {...getTagProps({ index })} />
        ))
      }
      renderOption={(option) => {
        const matches = match(option.primary_text, pageInputValue);
        const parts = parse(
          option.primary_text,
          matches
        );

        return (
          <Grid container alignItems="center">
            <Grid item xs>
              {parts.map((part, index) => (
                <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                  {part.text}
                </span>
              ))}

              <Typography variant="body2" color="textSecondary">
                {option.secondary_text}
              </Typography>
            </Grid>
          </Grid>
        );
      }}
    />
    <Autocomplete
      multiple
      id="namespace-filter"
      value={namespaceSelected}
      options={namespaces}
      disableCloseOnSelect
      getOptionLabel={(option) => option.namespace}
      getOptionSelected={(option, value) => option.namespace === value.namespace}
      onChange={(event, newValues) => {
        setNameSpaceSelected(newValues)
      }}
      renderOption={(option, { selected }) => (
        <React.Fragment>
          <Checkbox
            icon={checkboxIcon}
            checkedIcon={checkboxCheckedIcon}
            style={{ marginRight: 8 }}
            checked={selected}
          />
          {option.namespace}
        </React.Fragment>
      )}
      style={{ width: 500 }}
      renderInput={(params) => (
        <TextField {...params} variant="outlined" label="Namespaces" placeholder="Namespace" />
      )}
    />
    <Autocomplete
      multiple
      id="linked-to"
      style={{ width: 300 }}
      open={linkedToOpen}
      onOpen={() => {
        setLinkedToOpen(true);
      }}
      onClose={() => {
        setLinkedToOpen(false);
      }}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.primary_text)}
      filterOptions={(x) => x}
      options={linkedToOptions}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={linkedToValues}
      onChange={(event, newValues) => {
        setLinkedToOptions(newValues ? [...newValues, ...linkedToOptions] : linkedToOptions);
        setLinkedToValues(newValues);
        // TODO call onChange with new set of filter criteria
      }}
      onInputChange={(event, newInputValue) => {
        setLinkedToInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField {...params} 
          label="Linked to" 
          variant="outlined" 
          fullWidth 
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {linkedToLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
          />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip label={option.primary_text} {...getTagProps({ index })} />
        ))
      }
      renderOption={(option) => {
        const matches = match(option.primary_text, linkedToInputValue);
        const parts = parse(
          option.primary_text,
          matches
        );

        return (
          <Grid container alignItems="center">
            <Grid item xs>
              {parts.map((part, index) => (
                <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                  {part.text}
                </span>
              ))}

              <Typography variant="body2" color="textSecondary">
                {option.secondary_text}
              </Typography>
            </Grid>
          </Grid>
        );
      }}
    />
    <Autocomplete
      multiple
      id="linked-from"
      style={{ width: 300 }}
      open={linkedFromOpen}
      onOpen={() => {
        setLinkedFromOpen(true);
      }}
      onClose={() => {
        setLinkedFromOpen(false);
      }}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.primary_text)}
      filterOptions={(x) => x}
      options={linkedFromOptions}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={linkedFromValues}
      onChange={(event, newValues) => {
        setLinkedFromOptions(newValues ? [...newValues, ...linkedFromOptions] : linkedFromOptions);
        setLinkedFromValues(newValues);
        // TODO call onChange with new set of filter criteria
      }}
      onInputChange={(event, newInputValue) => {
        setLinkedFromInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField {...params} 
          label="Linked from" 
          variant="outlined" 
          fullWidth 
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {linkedFromLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
          />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip label={option.primary_text} {...getTagProps({ index })} />
        ))
      }
      renderOption={(option) => {
        const matches = match(option.primary_text, linkedFromInputValue);
        const parts = parse(
          option.primary_text,
          matches
        );

        return (
          <Grid container alignItems="center">
            <Grid item xs>
              {parts.map((part, index) => (
                <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                  {part.text}
                </span>
              ))}

              <Typography variant="body2" color="textSecondary">
                {option.secondary_text}
              </Typography>
            </Grid>
          </Grid>
        );
      }}
    />
    <Button
      onClick={handlePageFilterReset}
    >
    Reset to default
    </Button>
    </Popover>
    </Box>
  );
}

export default PageFilterControls;