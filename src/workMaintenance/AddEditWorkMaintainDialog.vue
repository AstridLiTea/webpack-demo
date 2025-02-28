<!-- 添加编辑工单dialog -->
<script lang="ts">
import { getRequest } from '@/utils/request';
import { Action, BepMessage, BepMessageBox, FormInstance, UploadFile, UploadFiles, UploadInstance, UploadRawFile, UploadRequestOptions, UploadUserFile } from 'bep-plus';
import BaseDialog from '@/pages/basePage/BaseDialog';
import { Component, toNative } from 'vue-facing-decorator';
import BepCascaderV2 from '@/components/bep/bepCascader/BepCascaderV2.vue';
import { UploadStatus } from '@/enums/UploadStatus';
import axios, { AxiosProgressEvent } from 'axios';
import { KWorkOrderOSSDir, OSSFileResponse, uploadFileApi } from '@/apis/uploadApi';
import { useWorkOrderStore } from '@/store/workOrderStore';
import { ISingleCheckedCascaderNode } from '@/components/bep/bepCascader/ISingleCheckedCascaderNode';
import { getUserListByRoleIdApi, creatorWorkOrderApi } from '@/apis/workOrderApi';
import { IWorkOrderStyleItem } from '@/interfaces/IWorkOrderStyleItem';
import { downloadFile } from '@/utils/commonTool';

@Component({ components: { BepCascaderV2 } })
class AddEditWorkMaintenanceDialog extends BaseDialog {
  mFormData = {
    areaUserId: '',
    itemUserId: '',
    portNum: '' as any,
    type: '' as any,
    subTypeList: [] as any[],
    deviceId: '',
    priority: '' as any,
    descriptions: '',
    processUserList: '',
    processRole: '',
    reportType: 2,
    attachmentLink: [] as any[]
  };

  deviceDataList = [] as Array<{ id: string; simId: string; name: string }>;

  processUserDataList = [] as Array<{ userId: number; name: string }>;
  workSubTypeList = [] as Array<IWorkOrderStyleItem>;

  showLoading = false;
  workOrderStore = useWorkOrderStore();
  showPicModal = false;
  showExcelModal = false;

  // file upload
  maxFileSize = 1; // 1M
  uploadFileList = [] as UploadUserFile[];
  uploadRef?: UploadInstance | null = null;
  currentProgress = 0; // 上传文件的进度
  currentUploadStatus = UploadStatus.UploadStatus_Init;
  // eslint-disable-next-line import/no-named-as-default-member
  uploadCancelTokenSource = axios.CancelToken.source();
  currentFileType: 1 | 2 | 3 = 3; // 1 表格  2图片  3文档

  showDeviceLoading = false;
  showProcessLoading = false;

  portNumList = [
    { name: '1号插座', value: 1 },
    { name: '2号插座', value: 2 },
    { name: '3号插座', value: 3 },
    { name: '4号插座', value: 4 },
    { name: '5号插座', value: 5 },
    { name: '6号插座', value: 6 },
    { name: '7号插座', value: 7 },
    { name: '8号插座', value: 8 },
    { name: '9号插座', value: 9 },
    { name: '10号插座', value: 10 },
    { name: '0号插座(整机)', value: 0 }
  ];

  rules = {
    bindAreaItemId: [{ required: true, validator: this.areaItemRuleValidator }],
    deviceId: [{ required: true, message: '请输入设备', trigger: 'change' }],
    portNum: [{ required: true, message: '请选择插座号', trigger: 'change' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
    type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
    subTypeList: [{ required: true, message: '请选择工单小类', trigger: 'change' }],
    descriptions: [{ required: true, message: '请输入工单描述', trigger: 'change' }]
  };

  areaItemRuleValidator(rule, value, callback) {
    if (!this.mFormData.areaUserId && !this.mFormData.itemUserId) {
      return callback(new Error('请先选择区域项目'));
    }
    callback();
  }

  closeDialogMethod() {
    this.mFormData.areaUserId = '';
    this.mFormData.itemUserId = '';
    this.mFormData.deviceId = '';
    this.mFormData.portNum = '';
    this.mFormData.priority = '';
    this.mFormData.type = '';
    this.mFormData.subTypeList = [];
    this.mFormData.descriptions = '';
    this.mFormData.processUserList = '';
    this.mFormData.processRole = '';
    this.mFormData.attachmentLink = [];
    this.processUserDataList = [];
    this.workSubTypeList = [];
    this.showLoading = false;
    this.$nextTick(() => {
      (this.$refs['workMaintainRef'] as FormInstance).clearValidate();
    });
    this.$emit('closeDialog');
  }

  submitWorkMainMethod() {
    (this.$refs['workMaintainRef'] as FormInstance).validate().then(valid => {
      if (valid) {
        this.sendGetAddEditWorkMainRequest();
      } else {
        return false;
      }
    });
  }

  sendGetAddEditWorkMainRequest() {
    if (this.showLoading) {
      return;
    }
    if (this.mFormData.processRole && this.processUserDataList.length == 0) {
      this.showMessage('当前角色下尚未配置对应人员，您可重新选择转交他人处理。 如需当前角色人员，请联系总部运维。');
      return;
    }
    this.showLoading = true;
    const resultStr = JSON.stringify(this.mFormData);
    const paramData = JSON.parse(resultStr);
    paramData.reportType = 2;
    paramData.deviceId = paramData.deviceId + '';

    creatorWorkOrderApi(paramData, (success: boolean, errMsg: string) => {
      this.showLoading = false;

      if (success) {
        this.showMessage('添加成功');
        this.closeDialogMethod();
        this.$emit('reloadDataList');
        return;
      }
      this.showErrorMsg(errMsg);
    });
  }

  sendGetDeviceDataRequest(itemUserId) {
    this.showDeviceLoading = true;
    getRequest('/device/search?itemUserId=' + itemUserId)
      .then(response => {
        this.showDeviceLoading = false;
        this.deviceDataList = (response?.data?.data || [])?.map(item => {
          return { id: item.id, name: item.name + '(' + item.simId + ')', simId: item.simId };
        });
      })
      .catch(() => {
        this.showDeviceLoading = false;
      });
  }

  cascaderDidChange(val: ISingleCheckedCascaderNode) {
    this.deviceDataList = [];
    if (val.level == 1) {
      this.mFormData.areaUserId = val.key;
      this.mFormData.itemUserId = '';
      this.processRoleDidChange(this.mFormData.processRole);
    } else if (val.level == 2) {
      this.mFormData.areaUserId = '';
      this.mFormData.itemUserId = val.key;
      this.sendGetDeviceDataRequest(val.key);
      this.processRoleDidChange(this.mFormData.processRole);
    } else {
      this.mFormData.areaUserId = '';
      this.mFormData.itemUserId = '';
      this.processUserDataList = [];
    }
    (this.$refs['workMaintainRef'] as FormInstance).validateField('bindAreaItemId');
  }

  workOrderTypeDidChanged(val) {
    // 工单类型选择
    this.mFormData.subTypeList = [];
    if (this.mFormData.type) {
      this.workSubTypeList = this.workOrderStore.workOrderTypeList.filter(item => item.type == this.mFormData.type)?.[0]?.subTypeList || [];
      return;
    }
    this.workSubTypeList = [];
  }

  processRoleDidChange(val) {
    this.processUserDataList = [];
    if (!this.mFormData.areaUserId && !this.mFormData.itemUserId) {
      return;
    }
    if (!this.mFormData.processRole) {
      return;
    }
    this.showProcessLoading = true;
    getUserListByRoleIdApi(val + '', this.mFormData.areaUserId, this.mFormData.itemUserId, (success: boolean, data) => {
      this.showProcessLoading = false;
      this.processUserDataList = data;
    });
  }

  downloadOSSFile(fileLink: string, fileName: string) {
    downloadFile(fileLink, fileName);
  }

  onBeforeUploadFile(rawFile: UploadRawFile) {
    if (!rawFile || !rawFile.name) {
      return false;
    }
    console.log(rawFile.type);

    if (this.currentProgress == UploadStatus.UploadStatus_Progress) {
      return false;
    }

    const supportTypeList = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!supportTypeList.includes(rawFile.type)) {
      BepMessage.error('上传文件格式不正确');
      return false;
    }
    if (rawFile.size > this.maxFileSize * 1024 * 1024) {
      BepMessage.error(`仅支持文件大小在 ${this.maxFileSize}M以内`);
      return false;
    }
    this.currentFileType = 3;
    if (rawFile.type == 'image/jpeg' || rawFile.type == 'image/png') {
      this.currentFileType = 2;
    } else if (rawFile.type == 'application/vnd.ms-excel' || rawFile.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      this.currentFileType = 1;
    }
  }

  uploadFileDidChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    if (uploadFile.status == 'ready') {
      this.uploadRef?.submit();
    }
  };

  /**
   * 上传Excel文件
   * @param options
   */
  uploadFileRequest(options: UploadRequestOptions) {
    const formData = new FormData();
    formData.append('file', options.file);

    uploadFileApi(
      formData,
      this.currentFileType,
      KWorkOrderOSSDir,
      this.uploadCancelTokenSource,
      (progressEvent: AxiosProgressEvent) => {
        this.currentUploadStatus = UploadStatus.UploadStatus_Progress;
        this.currentProgress = Number.parseInt(((progressEvent.progress || 0) * 100).toFixed(2));
      },
      (success: boolean, data: OSSFileResponse, errMsg: string) => {
        if (success) {
          this.mFormData.attachmentLink.push({ fileName: data.fileName, fileLink: data.fileLink });
          this.currentUploadStatus = UploadStatus.UploadStatus_Success;
          this.currentProgress = 0;
          BepMessage.success('上传成功');
          return;
        }
        BepMessage.error(errMsg);
      }
    );
  }

  deleteFile(index: number) {
    BepMessageBox.confirm('确定删除这个附件吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      callback: (action: Action) => {
        if (action == 'confirm') {
          this.mFormData.attachmentLink.splice(index, 1);
        }
      }
    });
  }
}

export default toNative(AddEditWorkMaintenanceDialog);
</script>

<template>
  <bep-dialog :model-value="isShowDialog" :title="currentTitle" width="760px" @close="closeDialogMethod" destroy-on-close :close-on-click-modal="false">
    <div v-loading="showLoading" element-loading-text="网络加载中，请稍后~">
      <bep-form :inline="true" label-position="right" label-width="80px" :rules="rules" :model="mFormData" ref="workMaintainRef">
        <bep-form-item label="区域项目" prop="bindAreaItemId">
          <BepCascaderV2 customClass="table-page-header-item" :multiple="false" :showLevels="[2, 3]" ref="cascaderRef" @change="cascaderDidChange" />
        </bep-form-item>

        <bep-form-item label="优先级" prop="priority">
          <bep-select v-model="mFormData.priority" class="table-page-header-item" placeholder="请选择优先级" clearable>
            <bep-option v-for="item in workOrderStore.priorityList" :key="item.value" :value="item.value" :label="item.name"></bep-option>
          </bep-select>
        </bep-form-item>

        <bep-form-item label="工单类型" prop="type">
          <bep-select v-model="mFormData.type" class="table-page-header-item" placeholder="请选择工单类型" clearable @change="workOrderTypeDidChanged">
            <bep-option v-for="item in workOrderStore.workOrderTypeList" :key="item.type" :value="item.type" :label="item.typeDesc"></bep-option>
          </bep-select>
        </bep-form-item>

        <bep-form-item label="工单小类" prop="subTypeList">
          <bep-select v-model="mFormData.subTypeList" class="table-page-header-item" placeholder="请选择工单类型" clearable filterable multiple collapse-tags :max-collapse-tag="1">
            <bep-option v-for="item in workSubTypeList" :key="item.type" :value="item.type" :label="item.typeDesc"></bep-option>
          </bep-select>
        </bep-form-item>

        <bep-form-item v-if="mFormData.itemUserId" label="设备" prop="deviceId" style="margin-top: -28px" :required="mFormData.type == 2">
          <bep-select v-model="mFormData.deviceId" v-loading="showDeviceLoading" class="table-page-header-item" placeholder="请选择设备" clearable filterable>
            <bep-option v-for="item in deviceDataList" :key="item.id" :value="item.id" :label="item.name"></bep-option>
          </bep-select>
        </bep-form-item>
        <bep-form-item v-if="mFormData.itemUserId" label="插座号" prop="portNum" :required="mFormData.type == 2">
          <div>
            <bep-select v-model="mFormData.portNum" class="table-page-header-item" placeholder="请选择插座号" clearable>
              <bep-option v-for="item in portNumList" :key="item.value" :value="item.value" :label="item.name"></bep-option>
            </bep-select>
            <div class="component-title-color">插座号“0”代表整机</div>
          </div>
        </bep-form-item>

        <bep-form-item label="处理人">
          <bep-select v-model="mFormData.processRole" class="table-page-header-item" placeholder="角色" clearable @change="processRoleDidChange">
            <bep-option v-for="item in workOrderStore.roleList" :key="item.value" :value="item.value" :label="item.name"></bep-option>
          </bep-select>
          <bep-select
            v-model="mFormData.processUserList"
            v-loading="showProcessLoading"
            class="table-page-header-item"
            placeholder="姓名"
            clearable
            filterable
            multiple
            collapse-tags
            :max-collapse-tag="1"
          >
            <bep-option v-for="item in processUserDataList" :key="item.userId" :value="item.userId" :label="item.name"></bep-option>
          </bep-select>
        </bep-form-item>

        <bep-form-item label="描述" prop="descriptions">
          <bep-input v-model="mFormData.descriptions" style="width: 560px" type="textarea" :rows="5" :maxlength="500" placeholder="请输入工单描述" clearable></bep-input>
        </bep-form-item>

        <bep-form-item label="附件">
          <div class="vertical-start">
            <bep-upload
              ref="uploadRef"
              action
              :before-upload="onBeforeUploadFile"
              :on-change="uploadFileDidChange"
              :http-request="uploadFileRequest"
              multiple
              :auto-upload="true"
              :show-file-list="false"
            >
              <div class="recharge-config-upload-container">
                <img class="img" src="@/assets/images/upload_logo.png" />
                <span class="content">点击上传</span>
              </div>
            </bep-upload>

            <div>
              {{ `仅支持png、jpg、xls、pdf、txt、docx等格式，大小在${maxFileSize}M以内` }}
            </div>
            <div style="height: 16px"></div>
            <bep-progress v-if="currentUploadStatus == 1" style="margin-top: 10px" :percentage="currentProgress" />
            <div v-for="(item, index) in mFormData.attachmentLink" class="vertical-start" :key="`KWorkMainFileAttachmentList${index}`">
              <div class="horizontal-start align-center">
                <img class="recharge-config-item-logo" :src="getCurrentFileLogo(item.fileName)" />
                <div class="upload-item-file-title">{{ item.fileName }}</div>
                <div class="recharge-config-item-download-button" @click="downloadOSSFile(item.fileLink, item.fileName)">下载</div>

                <bep-icon style="margin-left: 16px" @click="deleteFile(index)">
                  <Close color="#006D9B" />
                </bep-icon>
              </div>
              <div style="height: 5px"></div>
            </div>
          </div>
        </bep-form-item>
      </bep-form>
    </div>
    <template #footer>
      <div class="horizontal-center" style="margin-top: 16px">
        <bep-button type="primary" @click="submitWorkMainMethod">立即提交</bep-button>
        <bep-button type="default" @click="closeDialogMethod">取消</bep-button>
      </div>
    </template>
  </bep-dialog>
</template>

<style scoped lang="less">
@import '../../marketingActivity/rechargeSupportConfig/rechargeConfig.less';

.upload-item-file-title {
  height: 20px;
  width: 180px;
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.9);
  line-height: 20px;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
