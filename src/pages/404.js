import Layout from "../components/Layout"
import SEO from "../components/Seo"

const NotFoundPage = () => (
  <Layout>
    <div className="centerPage">
      <h1>NOT FOUND</h1>
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
    </div>
  </Layout>
)

export const Head = () => <SEO title="404: Not found" />

export default NotFoundPage
