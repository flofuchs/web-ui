import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { Row, Col } from 'patternfly-react';
import {
  getResource,
  getNamespace,
  getName,
  isHostOnline,
  getHostNics,
  getHostStorage,
} from 'kubevirt-web-ui-components';

import { BaremetalHostModel } from '../../models';
import { ResourcesEventStream } from '../../../kubevirt/components/okdcomponents';
import { navFactory } from '../utils/okdutils';
import { WithResources } from '../../../kubevirt/components/utils/withResources';
import {
  DetailsPage,
  List,
  ListHeader,
  ColHead,
  ResourceRow,
} from '../factory/okdfactory';

const BaremetalHostDetails = ({ host }) => {
  const nics = getHostNics(host);
  const online = isHostOnline(host);
  const ips = nics.map(nic => nic.ip).join(', ');

  const statusClasses = classNames({
    fa: true,
    'co-icon-and-text__icon': online === true,
    'fa-refresh': true,
  });

  return (
    <div className="co-m-pane__body">
      <h1 className="co-m-pane__heading">Baremetal Host Overview</h1>
      <Row>
        <Col lg={4} md={4} sm={4} xs={4} id="name-description-column">
          <dl>
            <dt>Name</dt>
            <dd>{getName(host)}</dd>
            <dt>Status</dt>
            <dd>
              <span className="co-icon-and-text">
                <span aria-hidden="true" className={statusClasses} />
                {online ? 'Running' : 'Not running'}
              </span>
            </dd>
            <dt>IP Addresses</dt>
            <dd>{ips}</dd>
          </dl>
        </Col>
      </Row>
    </div>
  );
};

const ConnectedBmDetails = ({ obj: bmh }) => {
  const { name, namespace } = bmh.metadata;
  const resourceMap = {
    bmh: {
      resource: getResource(BaremetalHostModel, {
        name,
        namespace,
        isList: false,
      }),
      ignoreErrors: true,
    },
  };

  return (
    <WithResources resourceMap={resourceMap}>
      <BaremetalHostDetails host={bmh} />
    </WithResources>
  );
};

const rowStyle = 'col-lg-2 col-md-3 col-sm-3 col-xs-4';

const NicHeader = props => (
  <ListHeader>
    <ColHead {...props} className={rowStyle} sortField="name">
      Name
    </ColHead>
    <ColHead {...props} className={rowStyle} sortField="model">
      Model
    </ColHead>
    <ColHead {...props} className={rowStyle} sortField="network">
      Network
    </ColHead>
    <ColHead {...props} className={rowStyle} sortField="ip">
      IP
    </ColHead>
    <ColHead {...props} className={rowStyle} sortField="speedGbps">
      Speed
    </ColHead>
    <ColHead {...props} className={rowStyle} sortField="mac">
      MAC Address
    </ColHead>
  </ListHeader>
);

const DiskHeader = props => (
  <ListHeader>
    <ColHead {...props} className={rowStyle} sortField="name">
      Disk name
    </ColHead>
    <ColHead {...props} className={rowStyle} sortField="model">
      Model
    </ColHead>
    <ColHead {...props} className={rowStyle} sortField="status">
      Status
    </ColHead>
    <ColHead {...props} className={rowStyle} sortField="type">
      Type
    </ColHead>
    <ColHead {...props} className={rowStyle} sortField="sizeGiB">
      Size (GB)
    </ColHead>
  </ListHeader>
);

const NicRow = ({ obj: nic }) => (
  <ResourceRow obj={nic}>
    <div className={rowStyle}>{nic.name}</div>
    <div className={rowStyle}>{nic.model}</div>
    <div className={rowStyle}>{nic.network}</div>
    <div className={rowStyle}>{nic.ip}</div>
    <div className={rowStyle}>{nic.speedGbps} Gbps</div>
    <div className={rowStyle}>{nic.mac}</div>
  </ResourceRow>
);

const DiskRow = ({ obj: disk }) => (
  <ResourceRow obj={disk}>
    <div className={rowStyle}>{disk.name}</div>
    <div className={rowStyle}>{disk.model}</div>
    <div className={rowStyle}>
      <span className="fa fa-icon fa-refresh" /> Running
    </div>
    <div className={rowStyle}>{disk.type}</div>
    <div className={rowStyle}>{disk.sizeGiB}</div>
  </ResourceRow>
);

const BaremetalHostNic = ({ obj: host }) => {
  const nics = getHostNics(host);
  return (
    <div className="co-m-list">
      <div className="co-m-pane__body">
        <List data={nics} Header={NicHeader} Row={NicRow} loaded={true} />
      </div>
    </div>
  );
};

const BaremetalHostDisk = ({ obj: host }) => {
  const disks = getHostStorage(host);
  return (
    <div className="co-m-list">
      <div className="co-m-pane__body">
        <List data={disks} Header={DiskHeader} Row={DiskRow} loaded={true} />
      </div>
    </div>
  );
};

const BaremetalHostEvents = ({ obj: host }) => {
  const ns = getNamespace(host);
  const bmObj = {
    name: getName(host),
    namespace: getNamespace(host),
  };
  const hostFilter = obj =>
    _.isMatch(obj, { ...bmObj, kind: BaremetalHostModel.kind });
  return <ResourcesEventStream filters={[hostFilter]} namespace={ns} />;
};

export const BaremetalHostsDetailPage = props => {
  const { name, namespace } = props;

  const nicsPage = {
    href: 'nics',
    name: 'Network Interfaces',
    component: BaremetalHostNic,
  };

  const disksPage = {
    href: 'disks',
    name: 'Disks',
    component: BaremetalHostDisk,
  };

  const pages = [
    navFactory.details(ConnectedBmDetails),
    navFactory.editYaml(),
    nicsPage,
    disksPage,
    navFactory.events(BaremetalHostEvents),
  ];
  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => [
        {
          name: props.match.params.ns,
          path: props.match.url.slice(0, props.match.url.lastIndexOf('/')),
        },
        { name: 'Baremetal Host Details', path: props.match.url },
      ]}
      pages={pages}
      resources={[
        getResource(BaremetalHostModel, { name, namespace, isList: false }),
      ]}
    />
  );
};
