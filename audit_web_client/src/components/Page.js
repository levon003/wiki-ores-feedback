import React, { forwardRef } from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const Page = forwardRef(({
  children,
  title = '',
  ...rest
}, ref) => {
  return (
    <div
      ref={ref}
      {...rest}
    >
      <Helmet>
        <title>{title}</title>
      </Helmet>
      {children}
    </div>
  );
});

Page.displayName = 'Page';

Page.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string
};

export default Page;
