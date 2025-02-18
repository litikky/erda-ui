// Copyright (c) 2021 Terminus, Inc.
//
// This program is free software: you can use, redistribute, and/or modify
// it under the terms of the GNU Affero General Public License, version 3
// or later ("AGPL"), as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import React from 'react';
import { Button, Divider, Form, Modal, Tabs } from 'antd';
import moment from 'moment';
import i18n from 'i18n';
import { allWordsFirstLetterUpper, firstCharToUpper, goTo } from 'common/utils';
import { FileEditor, MarkdownEditor, RenderFormItem, UserInfo } from 'common';
import { TagItem } from 'app/common/components/tags';
import ErdaTable from 'common/components/table';
import routeInfoStore from 'core/stores/route';
import projectLabel from 'project/stores/label';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import orgStore from 'app/org-home/stores/org';
import FileContainer from 'application/common/components/file-container';
import { checkVersion, formalRelease, getReleaseDetail, updateRelease } from 'project/services/release';

import './form.scss';

const { TabPane } = Tabs;

const promiseDebounce = (func: Function, delay = 1000) => {
  let timer: NodeJS.Timeout | undefined;
  return (...args: unknown[]) => {
    if (timer) {
      clearTimeout(timer);
    }
    return new Promise((resolve, reject) => {
      timer = setTimeout(async () => {
        try {
          await func(...args);
          resolve();
        } catch (e) {
          reject(e);
        }
      }, delay);
    });
  };
};

const ReleaseApplicationDetail = ({ isEdit = false }: { isEdit: boolean }) => {
  const [params] = routeInfoStore.useStore((s) => [s.params]);
  const { releaseID, projectId } = params;
  const orgId = orgStore.useStore((s) => s.currentOrg.id);
  const releaseDetail = getReleaseDetail.useData() || ({} as RELEASE.ReleaseDetail);
  const labelsList = projectLabel.useStore((s) => s.list);
  const { getLabels } = projectLabel.effects;
  const [form] = Form.useForm();
  const {
    version,
    applicationName,
    userId,
    createdAt,
    labels = {} as RELEASE.Labels,
    changelog,
    serviceImages = [],
    isFormal,
    clusterName,
    resources,
    tags,
  } = releaseDetail;

  const getDetail = React.useCallback(async () => {
    if (releaseID) {
      const res = await getReleaseDetail.fetch({ releaseID });
      const { data } = res;
      if (data) {
        if (isEdit) {
          form.setFieldsValue({
            version: data.version,
            changelog: data.changelog,
            tags: data.tags?.map((tag) => tag.id),
          });
        }
      }
    }
  }, [releaseID, isEdit, form]);

  React.useEffect(() => {
    getDetail();
  }, [getDetail]);

  React.useEffect(() => {
    getLabels({ type: 'release' });
  }, [getLabels]);

  const formal = () => {
    Modal.confirm({
      title: i18n.t('dop:Confirm to transfer {name} to formal?', {
        name: version,
        interpolation: { escapeValue: false },
      }),
      onOk: async () => {
        await formalRelease({
          releaseID,
          $options: { successMsg: i18n.t('{action} successfully', { action: i18n.t('dop:To Formal') }) },
        });
        getDetail();
      },
    });
  };

  const submit = () => {
    form.validateFields().then(async (values) => {
      const payload = {
        ...values,
        isStable: true,
        isFormal: false,
        isProjectRelease: false,
        releaseID,
        projectID: +projectId,
      };
      await updateRelease({ ...payload, $options: { successMsg: i18n.t('edited successfully') } });
      goTo(goTo.pages.applicationReleaseList);
    });
  };

  const check = React.useCallback(
    promiseDebounce(async (value: string) => {
      if (value && value !== version) {
        const payload = {
          orgID: orgId,
          isProjectRelease: true,
          projectID: +projectId,
          version: value,
        };
        const res = await checkVersion(payload);
        const { data } = res;
        if (data && !data.isUnique) {
          throw new Error(i18n.t('{name} already exists', { name: i18n.t('Version') }));
        }
      }
    }),
    [releaseDetail],
  );

  return (
    <div className="release-releaseDetail release-form h-full pb-16 relative">
      <Form layout="vertical" form={form} className="h-full">
        <Tabs defaultActiveKey="1" className="h-full">
          <TabPane tab={allWordsFirstLetterUpper(i18n.t('dop:basic information'))} key="1">
            <div className="mb-4 pl-0.5">
              {isEdit ? (
                <div className="w-2/5">
                  <RenderFormItem
                    label={i18n.t('Version')}
                    name="version"
                    type="input"
                    rules={[
                      {
                        required: true,
                        message: i18n.t('Please enter the {name}', { name: i18n.t('Version').toLowerCase() }),
                      },
                      { max: 30, message: i18n.t('dop:no more than 30 characters') },
                      {
                        pattern: /^[A-Za-z0-9._+-]+$/,
                        message: i18n.t('dop:Must be composed of letters, numbers, underscores, hyphens and dots.'),
                      },
                      {
                        validator: (_rule: unknown, value: string) => {
                          return check(value);
                        },
                      },
                    ]}
                  />
                </div>
              ) : (
                renderItems([{ label: i18n.t('Version'), value: version }])
              )}
              {isEdit ? (
                <div className="w-2/5">
                  <RenderFormItem
                    label={i18n.t('label')}
                    required={false}
                    name="tags"
                    type="select"
                    options={labelsList.map((item) => ({ ...item, value: item.id }))}
                    itemProps={{
                      mode: 'multiple',
                      optionRender: ({ name, color }: { name: string; color: string }) => (
                        <TagItem label={{ label: name, color }} readOnly />
                      ),
                    }}
                  />
                </div>
              ) : tags?.length ? (
                renderItems([
                  {
                    label: i18n.t('label'),
                    value: tags?.map((tag) => <TagItem label={{ label: tag.name, color: tag.color }} readOnly />),
                  },
                ])
              ) : null}
              {renderItems([
                { label: firstCharToUpper(i18n.t('dop:app name')), value: applicationName },
                { label: i18n.t('Cluster name'), value: clusterName },
                { label: i18n.t('Creator'), value: userId ? <UserInfo id={userId} /> : '-' },
                { label: i18n.t('Creation time'), value: createdAt && moment(createdAt).format('YYYY/MM/DD HH:mm:ss') },
                { label: i18n.t('dop:Code branch'), value: labels.gitBranch },
                { label: 'Commit ID', value: labels.gitCommitId },
                { label: 'Commit message', value: labels.gitCommitMessage },
                { label: `GitRepo ${i18n.t('dop:address')}`, value: labels.gitRepo },
              ])}
              {isEdit ? (
                <div className="w-4/5">
                  <RenderFormItem
                    label={firstCharToUpper(i18n.t('content'))}
                    name="changelog"
                    type="custom"
                    getComp={() => <EditMd />}
                  />
                </div>
              ) : (
                <div className="mb-2">
                  <div className="text-black-4 mb-2">{firstCharToUpper(i18n.t('content'))}</div>
                  <div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{changelog || i18n.t('dop:No content')}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </TabPane>
          <TabPane tab={i18n.t('dop:Image List')} key="2">
            <ErdaTable
              columns={[
                { title: i18n.t('Service name'), dataIndex: 'name' },
                { title: i18n.t('dop:Image name'), dataIndex: 'image' },
              ]}
              dataSource={serviceImages}
              onChange={() => getReleaseDetail({ releaseID })}
            />
          </TabPane>
          <TabPane tab="dice.yml" key="3">
            <FileContainer name="dice.yml">
              <FileEditor name="dice.yml" fileExtension="yml" value={releaseDetail.diceyml} readOnly />
            </FileContainer>
          </TabPane>
          {resources ? (
            <TabPane tab="resource" key="4">
              <div className="mb-4 pl-0.5">
                {resources.map((item, index) => (
                  <div>
                    {renderItems([
                      ...(item.meta
                        ? Object.keys(item.meta).map((key) => ({ label: key, value: item.meta[key] }))
                        : []),
                      { label: 'name', value: item.name },
                      { label: 'type', value: item.type },
                      { label: 'url', value: item.url },
                    ])}
                    {index !== resources.length - 1 ? <Divider /> : ''}
                  </div>
                ))}
              </div>
            </TabPane>
          ) : (
            ''
          )}
        </Tabs>
      </Form>

      <div className="absolute bottom-0 left-0 right-0 bg-white z-10 py-4">
        {isEdit ? (
          <Button className="mr-3 bg-default" type="primary" onClick={submit}>
            {i18n.t('submit')}
          </Button>
        ) : null}
        {!isFormal ? (
          <Button className="mr-3 bg-default" type="primary" onClick={formal}>
            {i18n.t('dop:To Formal')}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

const EditMd = ({ value, onChange, ...itemProps }: { value: string; onChange: (value: string) => void }) => {
  return <MarkdownEditor value={value} onChange={onChange} {...itemProps} defaultHeight={400} />;
};

const renderItems = (list: Array<{ label: string; value: React.ReactNode }>) => {
  return list.map((item) => (
    <div className="mb-2">
      <div className="text-black-4 mb-2">{item.label}</div>
      <div>{item.value || '-'}</div>
    </div>
  ));
};

export default ReleaseApplicationDetail;
