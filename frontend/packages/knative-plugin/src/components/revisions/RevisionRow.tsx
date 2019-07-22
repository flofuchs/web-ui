import * as React from 'react';
import * as cx from 'classnames';
import { TableRow, TableData } from '@console/internal/components/factory';
import { Kebab, ResourceLink, ResourceKebab, Timestamp } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { RevisionModel, ServiceModel } from '../../models';
import { getConditionString, getCondition } from '../../utils/condition-utils';
import { RevisionKind, ConditionTypes } from '../../types';
import { tableColumnClasses } from './revision-table';

const revisionReference = referenceForModel(RevisionModel);
const serviceReference = referenceForModel(ServiceModel);

export interface RevisionRowProps {
  obj: RevisionKind;
  index: number;
  key?: string;
  style: object;
}

const RevisionRow: React.FC<RevisionRowProps> = ({ obj, index, key, style }) => {
  const readyCondition = obj.status
    ? getCondition(obj.status.conditions, ConditionTypes.Ready)
    : null;
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={revisionReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.uid}
        />
      </TableData>
      <TableData className={cx(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={cx(tableColumnClasses[2], 'co-break-word')}>
        <ResourceLink
          kind={serviceReference}
          name={obj.metadata.labels['serving.knative.dev/service']}
          namespace={obj.metadata.namespace}
          title={obj.metadata.labels['serving.knative.dev/service']}
        />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {obj.status ? getConditionString(obj.status.conditions) : '-'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {(readyCondition && readyCondition.status) || '-'}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        {(readyCondition && readyCondition.message) || '-'}
      </TableData>
      <TableData className={tableColumnClasses[7]}>
        <ResourceKebab actions={Kebab.factory.common} kind={revisionReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export default RevisionRow;