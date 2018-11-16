# Notadd CMS模块(Grpc 版本)

## 功能

- [x] 文章管理
- [x] 文章分类管理
- [x] 消息管理 

## 使用说明

在应用程序根模块中导入 `CmsModule`后可以对文章分类、文章、消息进行管理操作。
对文章分类进行操作前需先创建一个顶级分类即总分类，创建时上级分类id为0即可。

CMS模块目前没有和用户模块进行关联,所以任何操作都无需权限,如需要权限限制，可以自行关联用户模块。

#接口说明

当前版本CMS模块提供了管理功能所需的基本接口，以下介绍常用的接口逻辑

### 文章分类

- `AddClassify` 添加文章分类
- `DelClassify` 删除指定分类
- `UpdateClassify` 更新指定分类信息
- `GetAllClassify` 获得所有分类

> tip:对文章分类进行操作前需先创建一个顶级分类即总分类，创建时上级分类id为0即可。

### 文章

- `CreateArticle` 添加文章
- `UpdateArticle` 修改文章
- `RecycleArticleByIds` 将指定文章放入回收站
- `DeleteArticleByIds` 将回收站中指定文章永久删除
- `RecoverArticleByIds` 将回收站中指定文章恢复
- `AuditArticle` 审核文章
- `GetAllArticle` 查看所有文章
- `GetArticleById` 查看指定文章

### 消息通知

- `CreateMessage` 创建消息
- `DeleteMessageById` 删除指定消息
- `GetAllMessage` 查看所有消息
- `GetMessageByUserId` 查看指定用户消息通知