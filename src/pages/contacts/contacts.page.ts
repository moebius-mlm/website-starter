
import { PageConfig } from '../../common/page-config';


const contactsPageConfig: PageConfig = {
  title: 'Contact Us',
  templatePath: `${__dirname}/contacts.twig`,
  filename: 'contacts/index.html',
  chunks: ['index'],
};

export default contactsPageConfig;
