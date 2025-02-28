<!-- 批量编辑工单dialog -->
<script lang="ts">
import { Component, Prop, toNative } from 'vue-facing-decorator';
import BaseDialog from '@/pages/basePage/BaseDialog';
import { Action, BepMessage, BepMessageBox, FormInstance, UploadFile, UploadInstance, UploadRawFile, UploadRequestOptions, UploadUserFile } from 'bep-plus';
import axios, { AxiosProgressEvent } from 'axios';
import { KPartnerOSSDir, OSSFileResponse, uploadFileApi } from '@/apis/uploadApi';
import { UploadStatus } from '@/enums/UploadStatus';
import { useUserStore } from '@/store/user';
import { UserRole } from '@/enums/UserRole';
import { useWorkOrderStore } from '@/store/workOrderStore';
import { downloadFile } from '@/utils/commonTool';
import {
  getUserListByRoleIdApi,
  closeWorkOrderApi,
  pendingWorkOrderApi,
  transferWorkOrderApi,
  batchTransferWorkOrderApi,
  batchPendingWorkOrderApi,
  batchCloseWorkOrderApi
} from '@/apis/workOrderApi';
import { IWorkOrderStyleItem } from '@/interfaces/IWorkOrderStyleItem';

@Component
class BatchEditWorkMaintainDialog extends BaseDialog {
  @Prop({ type: Array })
  tableData;

  @Prop({ type: Boolean, default: false })
  isBatch?: boolean;

  mFormData = {
    workOrderId: '' as any,
    processingResult: '',
    processRole: 600,
    reportType: 2,
    processUser: [] as any[],
    attachmentLink: [] as any[],
    type: '',
    subTypeList: []
  };

  // file upload
  maxFileSize = 1; // 1M
  uploadFileList = [] as UploadUserFile[];
  uploadRef?: UploadInstance | null = null;
  currentProgress = 0; // 上传文件的进度
  currentUploadStatus = UploadStatus.UploadStatus_Init;
  // eslint-disable-next-line import/no-named-as-default-member
  uploadCancelTokenSource = axios.CancelToken.source();
  currentFileType: 1 | 2 | 3 = 3; // 1 表格  2图片  3文档

  workOrderStore = useWorkOrderStore();
  showLoading = false;
  showLoadingProcess = false;
  workSubTypeList = [] as Array<IWorkOrderStyleItem>;

  processUserDataList = [] as Array<{ userId: number; name: string }>;

  rules = {
    processingResult: [{ required: true, message: '请输入处理反馈', trigger: 'change' }],
    type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
    subTypeList: [{ required: true, message: '请选择工单小类', trigger: 'change' }]
  };

  userStore = useUserStore();

  KNoProcessUserTip = '当前角色下尚未配置对应人员，您可重新选择转交他人处理。 如需当前角色人员，请联系总部运维。';

  showDialogMethod() {
    if (this.isBatch) {
      getUserListByRoleIdApi(this.mFormData.processRole + '', this.tableData[0]?.areaUserId, this.tableData[0]?.itemUserId, (success: boolean, data) => {
        this.processUserDataList = data;
      });
      return;
    }
    if (this.selectRow.type) {
      this.workSubTypeList = this.workOrderStore.workOrderTypeList.filter(item => item.type == this.selectRow.type)?.[0]?.subTypeList || [];
      this.mFormData.type = this.selectRow.type;
      this.mFormData.subTypeList = this.selectRow.subTypeDesc ? this.selectRow.subTypeDesc.split(',').map(item => this.workSubTypeList.find(i => i.typeDesc == item)?.type) : [];
    }
    getUserListByRoleIdApi(this.mFormData.processRole + '', this.selectRow.areaUserId, this.selectRow.itemUserId, (success: boolean, data) => {
      this.processUserDataList = data;
    });
  }

  closeDialogMethod() {
    this.mFormData = {
      workOrderId: '',
      reportType: 2,
      processingResult: '',
      processRole: 600,
      processUser: [],
      attachmentLink: [],
      type: '',
      subTypeList: []
    };
    this.processUserDataList = [];
    this.showLoading = false;
    this.closeDialog();
  }

  // 是否支持批量转派工单
  isSupportBatchTransforWorkOrder() {
    if (!this.isBatch) {
      return false;
    }
    if (this.tableData.length <= 1) {
      return true;
    }
    const firstAreaUserId = this.tableData[0].areaUserId;
    const firstItemUserId = this.tableData[0].itemUserId;
    if (this.tableData.filter(item => item.areaUserId != firstAreaUserId)?.length > 0 || this.tableData.filter(item => item.itemUserId != firstItemUserId)?.length > 0) {
      return false;
    }
    return true;
  }

  // 转派工单
  reassignmentWorkMaintainMethod() {
    if (this.mFormData.processRole && this.processUserDataList.length == 0) {
      this.showErrorMsg(this.KNoProcessUserTip);
      return;
    }
    if (this.showLoading) {
      return;
    }
    if (this.isBatch && !this.isSupportBatchTransforWorkOrder()) {
      this.showErrorMsg('多个不同的区域或项目的工单不支持批量转派。');
      return;
    }
    this.showLoading = true;
    if (this.isBatch) {
      this.mFormData.workOrderId = this.tableData.map(item => item.workOrderId);
    } else {
      this.mFormData.workOrderId = this.selectRow.workOrderId;
    }
    const formDataStr = JSON.stringify(this.mFormData);
    const paramData = JSON.parse(formDataStr);
    if (this.isBatch) {
      paramData.itemUserId = this.tableData[0].itemUserId;
      paramData.areaUserId = this.tableData[0].areaUserId;
      paramData.status = this.tableData[0].status;
      batchTransferWorkOrderApi(paramData, (success: boolean, errMsg: string) => {
        if (success) {
          this.showMessage('批量转派成功');
          this.closeDialogMethod();
          this.showLoading = false;
          this.reloadDataList();
          return;
        }
        this.showErrorMsg(errMsg);
        this.showLoading = false;
      });
      return;
    }
    paramData.status = this.selectRow.status;
    paramData.itemUserId = this.selectRow.itemUserId;
    paramData.areaUserId = this.selectRow.areaUserId;
    transferWorkOrderApi(paramData, (success: boolean, errMsg: string) => {
      if (success) {
        this.showMessage('转派成功');
        this.closeDialogMethod();
        this.showLoading = false;
        this.reloadDataList();
        return;
      }
      this.showErrorMsg(errMsg);
      this.showLoading = false;
    });
  }

  // 工单挂起
  hangupWorkMaintainMethod() {
    if (this.showLoading) {
      return;
    }
    this.showLoading = true;
    if (this.isBatch) {
      this.mFormData.workOrderId = this.tableData.map(item => item.workOrderId);
    } else {
      this.mFormData.workOrderId = this.selectRow.workOrderId;
    }
    if (this.isBatch) {
      batchPendingWorkOrderApi(this.mFormData, (success: boolean, errMsg: string) => {
        if (success) {
          this.showMessage('批量挂起成功');
          this.closeDialogMethod();
          this.showLoading = false;
          this.reloadDataList();
          return;
        }
        this.showErrorMsg(errMsg);
        this.showLoading = false;
      });
      return;
    }
    pendingWorkOrderApi(this.mFormData, (success: boolean, errMsg: string) => {
      if (success) {
        this.showMessage('挂起成功');
        this.closeDialogMethod();
        this.showLoading = false;
        this.reloadDataList();
        return;
      }
      this.showErrorMsg(errMsg);
      this.showLoading = false;
    });
  }
  workOrderTypeDidChanged() {
    // 工单类型选择
    this.mFormData.subTypeList = [];
    if (this.mFormData.type) {
      this.workSubTypeList = this.workOrderStore.workOrderTypeList.filter(item => item.type == this.mFormData.type)?.[0]?.subTypeList || [];
      return;
    }
    this.workSubTypeList = [];
  }

  // 关闭工单
  closeWorkOrderMethod(operateType = 4) {
    if (this.showLoading) {
      return;
    }
    this.showLoading = true;
    if (this.isBatch) {
      this.mFormData.workOrderId = this.tableData.map(item => item.workOrderId);
    } else {
      this.mFormData.workOrderId = this.selectRow.workOrderId;
    }

    const resultStr = JSON.stringify(this.mFormData);
    const paramData = JSON.parse(resultStr);
    paramData.operateType = operateType;
    if (this.isBatch) {
      paramData.deviceIdList = this.tableData.map(item => item?.deviceId || '');
    } else {
      paramData.deviceId = this.selectRow.deviceId;
    }
    if (this.isBatch) {
      batchCloseWorkOrderApi(paramData, (success: boolean, errMsg: string) => {
        if (success) {
          this.showMessage('批量关闭成功');
          this.closeDialogMethod();
          this.showLoading = false;
          this.reloadDataList();
          return;
        }
        this.showErrorMsg(errMsg);
        this.showLoading = false;
      });
      return;
    }
    closeWorkOrderApi(paramData, (success: boolean, errMsg: string) => {
      if (success) {
        this.showMessage('关闭成功');
        this.closeDialogMethod();
        this.showLoading = false;
        this.reloadDataList();
        return;
      }
      this.showErrorMsg(errMsg);
      this.showLoading = false;
    });
  }

  submitBatchWorkMainMethod(type: number) {
    if (this.isBatch) {
      BepMessageBox.confirm(`您已选择${this.tableData.length}个工单批量处理，是否确认提交反馈结果？`, '确认提交', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        callback: (action: Action) => {
          if (action == 'confirm') {
            this.validWorkMaintainFormMethod(type);
          }
        }
      });
      return;
    }
    this.validWorkMaintainFormMethod(type);
  }

  /**
   * 表单校验
   * @param type 1 转派  2 中途关闭  3 工单挂起  4 完成工单
   */
  validWorkMaintainFormMethod(type: number) {
    (this.$refs.dealWorkmatainRef as FormInstance).validate().then(valid => {
      if (valid) {
        if (type == 1) {
          this.reassignmentWorkMaintainMethod();
        } else if (type == 2) {
          this.closeWorkOrderMethod(2);
        } else if (type == 3) {
          this.hangupWorkMaintainMethod();
        } else if (type == 4) {
          this.closeWorkOrderMethod();
        }
      } else {
        return false;
      }
    });
  }

  onBeforeUploadFile(rawFile: UploadRawFile) {
    if (!rawFile || !rawFile.name) {
      return false;
    }

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

  downloadOSSFile(fileLink: string, fileName: string) {
    downloadFile(fileLink, fileName);
  }

  uploadFileDidChange = (uploadFile: UploadFile) => {
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
      KPartnerOSSDir,
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

  processRoleDidChange(val) {
    this.processUserDataList = [];
    this.showLoadingProcess = true;
    if (this.isBatch) {
      getUserListByRoleIdApi(val + '', this.tableData[0]?.areaUserId, this.tableData[0]?.itemUserId, (success: boolean, data) => {
        this.showLoadingProcess = false;
        this.processUserDataList = data;
      });
      return;
    }
    getUserListByRoleIdApi(val + '', this.selectRow.areaUserId, this.selectRow.itemUserId, (success: boolean, data) => {
      this.showLoadingProcess = false;
      this.processUserDataList = data;
    });
  }

  isCustomerRole() {
    if (this.userStore.isRoot) {
      return true;
    }
    return this.userStore.roleKey == UserRole.Customer_ROLE || this.userStore.roleKey == UserRole.YUNWEI_ROLE;
  }
}

export default toNative(BatchEditWorkMaintainDialog);
</script>

<template>
  <bep-dialog :model-value="isShowDialog" :title="isBatch ? '批量处理工单' : '处理工单'" width="980px" @open="showDialogMethod" @close="closeDialogMethod" destroy-on-close>
    <template #header="{ titleClass }">
      <div class="horizontal-start align-center">
        <span :class="titleClass">{{ isBatch ? '批量处理工单' : '处理工单' }}</span>
        <div v-if="isBatch" style="margin-left: 5px; margin-top: -3px">
          已选择<span style="color: red">{{ tableData.length }}</span> 条工单
        </div>
      </div>
    </template>
    <div v-loading="showLoading" element-loading-text="网络加载中，请稍后~">
      <bep-form :model="mFormData" ref="dealWorkmatainRef" label-position="right" label-width="100px" :rules="rules">
        <p v-if="isBatch" class="batch-deal-text">如您选择多个项目的工单批量处理，仅支持完单操作，不可批量转派。</p>
        <bep-form-item label="工单类型" required>
          <bep-row>
            <bep-form-item prop="type">
              <bep-select v-model="mFormData.type" class="table-page-header-item" placeholder="请选择工单类型" clearable @change="workOrderTypeDidChanged">
                <bep-option v-for="item in workOrderStore.workOrderTypeList" :key="item.type" :value="item.type" :label="item.typeDesc"></bep-option>
              </bep-select>
            </bep-form-item>
            <bep-form-item prop="subTypeList">
              <bep-select
                v-model="mFormData.subTypeList"
                class="table-page-header-item"
                placeholder="请选择工单小类"
                clearable
                filterable
                multiple
                collapse-tags
                :max-collapse-tag="1"
              >
                <bep-option v-for="item in workSubTypeList" :key="item.type" :value="item.type" :label="item.typeDesc"></bep-option>
              </bep-select>
            </bep-form-item>
          </bep-row>
        </bep-form-item>
        <bep-form-item label="处理反馈" prop="processingResult" :style="{ marginTop: (isBatch ? 16 : 0) + 'px' }">
          <bep-input v-model="mFormData.processingResult" style="width: 800px" type="textarea" :maxlength="500" :rows="5" placeholder="请输入工单描述" clearable></bep-input>
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
              {{ `仅支持png、jpg、xls,pdf、txt、docx等格式，大小在${maxFileSize}M以内` }}
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

        <bep-form-item label="转派处理人">
          <div>
            <div class="horizontal-start">
              <bep-select v-model="mFormData.processRole" class="table-page-header-item" placeholder="角色" clearable @change="processRoleDidChange">
                <bep-option v-for="item in workOrderStore.roleList" :key="item.value" :value="item.value" :label="item.name"></bep-option>
              </bep-select>
              <bep-select
                v-model="mFormData.processUser"
                v-loading="showLoadingProcess"
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
            </div>
            <div>无法自行处理选择转派工单。如需现场查验选择项目管理员处理，如需上级协助，可选择总部运维或区域对接人等。可不指定具体人员</div>
          </div>
        </bep-form-item>
      </bep-form>
      <div class="horizontal-center" style="margin-top: 36px">
        <bep-button @click="closeDialogMethod">取消</bep-button>
        <bep-button @click="submitBatchWorkMainMethod(1)">转派</bep-button>
        <bep-button v-if="isCustomerRole()" type="primary" @click="submitBatchWorkMainMethod(2)">中途关闭</bep-button>
        <bep-button v-if="isCustomerRole()" type="primary" @click="submitBatchWorkMainMethod(3)">工单挂起</bep-button>
        <bep-button type="primary" @click="submitBatchWorkMainMethod(4)">完成工单</bep-button>
      </div>
    </div>
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
.batch-deal-text {
  margin-bottom: 16px;
}
</style>
