import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import clsx from 'clsx';
import moment from 'moment';
import { v4 as uuid } from 'uuid';
import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextareaAutosize,
  TextField,
  Tooltip,
  Paper,
  makeStyles
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {},
  actions: {
    justifyContent: 'flex-end'
  },
}));

const RevisionView = ({revision, className, ...rest }) => {
  const classes = useStyles();
  
  const [revisionDiff, setRevisionDiff] = useState("Diff not loaded yet.");
      
  // demonstration of using the Compare API to retrieve HTML and set it to state.
  // Note that it needs styling to look anything like the Wikipedia view!
  // https://www.mediawiki.org/wiki/Manual:CORS
  useEffect(() => {
    fetch('https://en.wikipedia.org/w/api.php?action=compare&fromrev=1001836865&torev=1001836878&format=json&origin=*', {
        crossDomain: true,
        method: 'GET',
        headers: {'Content-Type': 'application/json',
                 'Origin': 'http://localhost:3000'
                 },
      })
        .then(res => res.json())
        .then(data => {
          //console.log(data.compare['*']);
          setRevisionDiff(data.compare['*']);
    });
  }, []);
  
  return (
    <Paper
      className={clsx(classes.root, className)}
      variant="outlined"
      m={1}
      p={1}
      {...rest}
    >
      <Box 
        display="flex"
        flexWrap="nowrap"
        flexDirection="row"
        flexGrow={1}
        width = "1300px"
      >
        {/* style={{'overflowY': 'scroll'}} */}
        {/* ext-overflow= ellipsis; flexWrap="wrap" */}
        {/* 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'overflow': '' */}
        {/* marginRight='20px' flexWrap="wrap"  */}

        <Box maxHeight="80vh" width="80vx" style={{'overflowY': 'scroll'}}>
        <tr>
            <td colspan="2" class="diff-lineno">Line 33:</td>
          </tr>
          <tr>
            <td class="diff-marker">&#160;</td>
            <td class="diff-context"></td>
          </tr>
          <tr>
            <td class="diff-marker">&#160;</td>
            <td class="diff-context"><div>==Description==</div></td>
          </tr>
          <tr>
            <td class="diff-marker">−</td>
            <td class="diff-deletedline">
               <div>
                {`''Armadillidium vulgare'' may reach a length of {{convert|18|mm}}, and is capable of rolling into a ball when disturbed; this ability, along with its general appearance, gives it the name ''pill-bug''<del class="diffchange diffchange-inline"> or "Rolly Polly"</del> and also creates the potential for confusion with [[pill millipede]]s such as ''[[Glomeris marginata]]''.&lt;ref name="ARKive"&gt;{{cite web |url=http://www.arkive.org/pill-woodlouse/armadillidium-vulgare/info.html |title=Pill woodlouse (''Armadillidium vulgare'') |publisher=[[ARKive|ARKive.org]] |accessdate=February 13, 2009 |archive-url=https://web.archive.org/web/20090903034429/http://www.arkive.org/pill-woodlouse/armadillidium-vulgare/info.html |archive-date=2009-09-03 |url-status=dead }}&lt;/ref&gt; It can be distinguished from ''[[Armadillidium nasatum]]'' and ''[[Armadillidium depressum]]'' by the gap that ''A. nasatum'' and ''A. depressum'' leave when rolling into a ball; ''A. vulgare'' does not leave such a gap.&lt;ref&gt;{{cite web |url=http://www.nhm.ac.uk/nature-online/life/other-invertebrates/walking-with-woodlice/identification.html |title=Woodlouse Wizard: an identification key |publisher=[[Natural History Museum, London|Natural History Museum]] |accessdate=August 20, 2014}}&lt;/ref&gt;`}
              </div>
            </td>
          </tr>
          <tr>
            <td class="diff-marker">&#160;</td>
            <td class="diff-context"></td>
          </tr>
          <tr>
            <td class="diff-marker">&#160;</td>
            <td class="diff-context"><div>==Ecology==</div></td>
          </tr>
          <tr>
            <td colspan="2" class="diff-lineno">Line 49:</td>
          </tr>
          <tr>
            <td class="diff-marker">&#160;</td>
            <td class="diff-context"></td>
          </tr>
          <tr>
            <td class="diff-marker">&#160;</td>
            <td class="diff-context"><div>==Mitochondrial genome==</div></td>
          </tr>
          <tr>
            <td class="diff-marker">−</td>
            <td class="diff-deletedline"><div>{`Most metazoans have circular [[Mitochondrial DNA|mitochondrial genomes]], but ''A.vulgare'' has an unusual combination of both circular and linear mitochondrial DNA.&lt;ref&gt;{{cite journal|doi=10.1007/s00239-007-9037-5|pmid=17906827|title=Structure and Evolution of the Atypical Mitochondrial Genome of Armadillidium vulgare (Isopoda, Crustacea)|journal=Journal of Molecular Evolution|volume=65|issue=6|pages=651–9|year=2007|last1=Marcadé|first1=Isabelle|last2=Cordaux|first2=Richard|last3=Doublet|first3=Vincent|last4=Debenest|first4=Catherine|last5=Bouchon|first5=Didier|last6=Raimond|first6=Roland|bibcode=2007JMolE..65..651M|citeseerx=10.1.1.688.9796}}&lt;/ref&gt;`}<del class="diffchange diffchange-inline"> They often also live underground so.. if you go digging next time make sure you are exty careful!</del></div></td>
          </tr>
          <tr>
            <td class="diff-marker">&#160;</td>
            <td class="diff-context"></td>
          </tr>
          <tr>
            <td class="diff-marker">&#160;</td>
            <td class="diff-context"><div>==Gallery==</div></td>
          </tr>
        </Box>
        
        <Box maxHeight="80vh" maxWidth="80vw" style={{'overflowY': 'scroll'}}>
        <tr>
          <td colspan="2" class="diff-lineno">Line 33:</td>
        </tr>
        <tr>
          <td class="diff-marker">&#160;</td>
          <td class="diff-context"></td>
        </tr>
        <tr>
          <td class="diff-marker">&#160;</td>
          <td class="diff-context"><div>==Description==</div></td>
        </tr>
        <tr>
          <td class="diff-marker">+</td>
          <td class="diff-addedline"><div>{`''Armadillidium vulgare'' may reach a length of {{convert|18|mm}}, and is capable of rolling into a ball when disturbed; this ability, along with its general appearance, gives it the name ''pill-bug'' and also creates the potential for confusion with [[pill millipede]]s such as ''[[Glomeris marginata]]''.&lt;ref name="ARKive"&gt;{{cite web |url=http://www.arkive.org/pill-woodlouse/armadillidium-vulgare/info.html |title=Pill woodlouse (''Armadillidium vulgare'') |publisher=[[ARKive|ARKive.org]] |accessdate=February 13, 2009 |archive-url=https://web.archive.org/web/20090903034429/http://www.arkive.org/pill-woodlouse/armadillidium-vulgare/info.html |archive-date=2009-09-03 |url-status=dead }}&lt;/ref&gt; It can be distinguished from ''[[Armadillidium nasatum]]'' and ''[[Armadillidium depressum]]'' by the gap that ''A. nasatum'' and ''A. depressum'' leave when rolling into a ball; ''A. vulgare'' does not leave such a gap.&lt;ref&gt;{{cite web |url=http://www.nhm.ac.uk/nature-online/life/other-invertebrates/walking-with-woodlice/identification.html |title=Woodlouse Wizard: an identification key |publisher=[[Natural History Museum, London|Natural History Museum]] |accessdate=August 20, 2014}}&lt;/ref&gt;`}</div></td>
        </tr>
        <tr>
          <td class="diff-marker">&#160;</td>
          <td class="diff-context"></td>
        </tr>
        <tr>
          <td class="diff-marker">&#160;</td>
          <td class="diff-context"><div>==Ecology==</div></td>
        </tr>
        <tr>
          <td colspan="2" class="diff-lineno">Line 49:</td>
        </tr>
        <tr>
          <td class="diff-marker">&#160;</td>
          <td class="diff-context"></td>
        </tr>
        <tr>
          <td class="diff-marker">&#160;</td>
          <td class="diff-context"><div>==Mitochondrial genome==</div></td>
        </tr>
        <tr>
          <td class="diff-marker">+</td>
          <td class="diff-addedline"><div>{`Most metazoans have circular [[Mitochondrial DNA|mitochondrial genomes]], but ''A.vulgare'' has an unusual combination of both circular and linear mitochondrial DNA.&lt;ref&gt;{{cite journal|doi=10.1007/s00239-007-9037-5|pmid=17906827|title=Structure and Evolution of the Atypical Mitochondrial Genome of Armadillidium vulgare (Isopoda, Crustacea)|journal=Journal of Molecular Evolution|volume=65|issue=6|pages=651–9|year=2007|last1=Marcadé|first1=Isabelle|last2=Cordaux|first2=Richard|last3=Doublet|first3=Vincent|last4=Debenest|first4=Catherine|last5=Bouchon|first5=Didier|last6=Raimond|first6=Roland|bibcode=2007JMolE..65..651M|citeseerx=10.1.1.688.9796}}&lt;/ref&gt;`}</div></td>
        </tr>
        <tr>
          <td class="diff-marker">&#160;</td>
          <td class="diff-context"></td>
        </tr>
        <tr>
          <td class="diff-marker">&#160;</td>
          <td class="diff-context"><div>==Gallery==</div></td>
        </tr>
        </Box>
      </Box>
    </Paper>
  );
};

RevisionView.propTypes = {
  className: PropTypes.string
};

export default RevisionView;
