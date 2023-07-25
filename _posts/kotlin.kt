import org.w3c.dom.Node
import javax.xml.parsers.DocumentBuilderFactory

fun parseDataCiteMetadata(xml: String): DataCiteMetadata {
    val factory = DocumentBuilderFactory.newInstance()
    val builder = factory.newDocumentBuilder()
    val doc = builder.parse(xml.byteInputStream())
    val root = doc.documentElement

    fun getNodeValue(node: Node, tagName: String): String {
        return node.getElementsByTagName(tagName).item(0).textContent
    }

    fun parseCreators(node: Node): List<Creator> {
        val creatorsNodeList = node.getElementsByTagName("creators").item(0).childNodes
        return (0 until creatorsNodeList.length).map { i ->
            val creatorNode = creatorsNodeList.item(i)
            Creator(
                getNodeValue(creatorNode, "creatorName"),
                getNodeValue(creatorNode, "givenName"),
                getNodeValue(creatorNode, "familyName"),
                listOf()
            )
        }
    }

    fun parseTitles(node: Node): List<Title> {
        val titlesNodeList = node.getElementsByTagName("titles").item(0).childNodes
        return (0 until titlesNodeList.length).map { i ->
            val titleNode = titlesNodeList.item(i)
            Title(
                getNodeValue(titleNode, "title"),
                getNodeValue(titleNode, "type")
            )
        }
    }

    fun parseResourceType(node: Node): ResourceType {
        val resourceTypeNode = node.getElementsByTagName("resourceType").item(0)
        return ResourceType(
            getNodeValue(resourceTypeNode, "resourceTypeGeneral"),
            getNodeValue(resourceTypeNode, "resourceType")
        )
    }

    fun parseVersions(node: Node): List<String> {
        val versionsNodeList = node.getElementsByTagName("versions").item(0).childNodes
        return (0 until versionsNodeList.length).map { i ->
            versionsNodeList.item(i).textContent
        }
    }

    fun parseFormats(node: Node): List<String> {
        val formatsNodeList = node.getElementsByTagName("formats").item(0).childNodes
        return (0 until formatsNodeList.length).map { i ->
            formatsNodeList.item(i).textContent
        }
    }

    fun parseSubjects(node: Node): List<String> {
        val subjectsNodeList = node.getElementsByTagName("subjects").item(0).childNodes
        return (0 until subjectsNodeList.length).map { i ->
            subjectsNodeList.item(i).textContent
        }
    }

}
