/**
 * layouts/AppLayout.jsx
 * Authenticated application shell — renders Sidebar + Header + page content.
 * Used by all protected pages.
 *
 * TODO: Build out Sidebar and Header components in components/layout/
 */
const AppLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* <Sidebar /> */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* <Header /> */}
        <main style={{ flex: 1, padding: '1.5rem' }}>{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
